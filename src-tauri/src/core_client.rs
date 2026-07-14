use mythoside_core::rpc::{Notification, Request, Response};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex as StdMutex};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::{oneshot, Mutex as AsyncMutex};

const FILE_CHANGED_EVENT: &str = "manuscript://file-changed";

/// Locates the sibling `mythoside-core` binary. Both crates are members of
/// the same Cargo workspace, so `cargo build`/`cargo run` put them in the
/// same `target/{debug,release}/` directory as this app's own executable —
/// hence looking next to `current_exe()` rather than hardcoding a path.
///
/// Not yet handled: production app bundles. A packaged Tauri app needs
/// `mythoside-core` bundled as a proper Tauri "sidecar" binary (see
/// `tauri.conf.json`'s `bundle.externalBin`) with the target-triple-suffixed
/// naming Tauri's bundler expects — that's a follow-up, not solved here.
fn resolve_core_binary_path() -> Result<PathBuf, String> {
    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = current_exe
        .parent()
        .ok_or_else(|| "could not determine executable directory".to_string())?;
    let binary_name = if cfg!(windows) {
        "mythoside-core.exe"
    } else {
        "mythoside-core"
    };

    let candidate = dir.join(binary_name);
    if candidate.exists() {
        return Ok(candidate);
    }

    // `cargo test` harness binaries live in `target/debug/deps/`, one level
    // below where `cargo build`/`cargo run` puts named binaries like
    // `mythoside-core` — check the parent directory too so tests can find it.
    if dir.file_name().is_some_and(|name| name == "deps") {
        if let Some(profile_dir) = dir.parent() {
            let candidate = profile_dir.join(binary_name);
            if candidate.exists() {
                return Ok(candidate);
            }
        }
    }

    Err(format!(
        "mythoside-core binary not found next to {current_exe:?} — build it with `cargo build -p mythoside-core`"
    ))
}

struct Inner {
    stdin: AsyncMutex<ChildStdin>,
    pending: StdMutex<HashMap<u64, oneshot::Sender<Response>>>,
    next_id: AtomicU64,
    // Keeping the Child here ties its lifetime to CoreClient (and therefore
    // to Tauri's managed state, i.e. the app's lifetime) — dropping it would
    // close stdin, which ends the core process's read loop.
    _child: Child,
}

/// A thin client for the local `mythoside-core` server process: spawns it,
/// speaks the stdin/stdout JSON-RPC protocol defined in
/// `mythoside_core::rpc`, and forwards its `"file-changed"` notifications
/// as Tauri events. All actual manuscript logic (parsing, file I/O,
/// watching) lives in that separate process — see CLAUDE.md.
#[derive(Clone)]
pub struct CoreClient(Arc<Inner>);

impl CoreClient {
    pub fn spawn(app: &AppHandle) -> Result<Self, String> {
        let binary_path = resolve_core_binary_path()?;

        let mut child = Command::new(binary_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::inherit())
            .spawn()
            .map_err(|e| e.to_string())?;

        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "failed to capture mythoside-core stdin".to_string())?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "failed to capture mythoside-core stdout".to_string())?;

        let client = CoreClient(Arc::new(Inner {
            stdin: AsyncMutex::new(stdin),
            pending: StdMutex::new(HashMap::new()),
            next_id: AtomicU64::new(1),
            _child: child,
        }));

        let reader_client = client.clone();
        let app_handle = app.clone();
        tauri::async_runtime::spawn(async move {
            let mut lines = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                reader_client.handle_line(&app_handle, &line);
            }
        });

        Ok(client)
    }

    fn handle_line(&self, app: &AppHandle, line: &str) {
        let Ok(value) = serde_json::from_str::<serde_json::Value>(line) else {
            return;
        };

        if value.get("id").is_some() {
            let Ok(response) = serde_json::from_value::<Response>(value) else {
                return;
            };
            if let Some(sender) = self.0.pending.lock().unwrap().remove(&response.id) {
                let _ = sender.send(response);
            }
            return;
        }

        if let Ok(notification) = serde_json::from_value::<Notification>(value) {
            if notification.method == "file-changed" {
                let _ = app.emit(FILE_CHANGED_EVENT, notification.params);
            }
        }
    }

    /// Sends one JSON-RPC request and awaits its matching response.
    pub async fn call(
        &self,
        method: &str,
        params: serde_json::Value,
    ) -> Result<serde_json::Value, String> {
        let id = self.0.next_id.fetch_add(1, Ordering::SeqCst);
        let (tx, rx) = oneshot::channel();
        self.0.pending.lock().unwrap().insert(id, tx);

        let request = Request {
            id,
            method: method.to_string(),
            params,
        };
        let mut line = serde_json::to_string(&request).map_err(|e| e.to_string())?;
        line.push('\n');

        {
            let mut stdin = self.0.stdin.lock().await;
            stdin
                .write_all(line.as_bytes())
                .await
                .map_err(|e| e.to_string())?;
            stdin.flush().await.map_err(|e| e.to_string())?;
        }

        let response = rx.await.map_err(|_| {
            self.0.pending.lock().unwrap().remove(&id);
            "mythoside-core closed the connection before responding".to_string()
        })?;

        match (response.result, response.error) {
            (Some(result), _) => Ok(result),
            (None, Some(error)) => Err(error),
            (None, None) => Ok(serde_json::Value::Null),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Exercises the exact I/O pattern `CoreClient` uses (spawn the real
    /// compiled `mythoside-core` binary, write a request line to its stdin,
    /// read a response line from its stdout) without going through
    /// `CoreClient` itself, since that requires a live `AppHandle` (a mock
    /// one needs the `tauri`/test` feature and a matching `Runtime` generic
    /// this module doesn't carry). This is what proves the two crates'
    /// shared `mythoside_core::rpc` types actually serialize compatibly
    /// across the real process boundary, not just in-process.
    #[tokio::test]
    async fn spawns_the_real_core_binary_and_round_trips_a_request() {
        let binary_path =
            resolve_core_binary_path().expect("mythoside-core binary should be built already");
        let dir = tempfile::tempdir().unwrap();

        let mut child = Command::new(binary_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .expect("should spawn mythoside-core");

        let mut stdin = child.stdin.take().unwrap();
        let stdout = child.stdout.take().unwrap();

        let request = Request {
            id: 1,
            method: "create_character".to_string(),
            params: serde_json::json!({
                "bookDir": dir.path().to_string_lossy(),
                "bookId": "book-1",
                "name": "Lyra Vance",
                "role": "Protagonist",
            }),
        };
        let mut line = serde_json::to_string(&request).unwrap();
        line.push('\n');
        stdin.write_all(line.as_bytes()).await.unwrap();
        stdin.flush().await.unwrap();

        let mut reader = BufReader::new(stdout);
        let mut response_line = String::new();
        reader.read_line(&mut response_line).await.unwrap();
        let response: Response = serde_json::from_str(response_line.trim()).unwrap();

        assert_eq!(response.id, 1);
        assert!(
            response.error.is_none(),
            "unexpected error: {:?}",
            response.error
        );
        let character = response.result.expect("should have a result");
        assert_eq!(character["name"], "Lyra Vance");

        drop(stdin);
        let _ = child.wait().await;
    }
}
