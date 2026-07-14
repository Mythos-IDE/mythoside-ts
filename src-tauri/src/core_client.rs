use mythoside_core::rpc::{Notification, Request, Response};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex as StdMutex};
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tokio::sync::oneshot;

const FILE_CHANGED_EVENT: &str = "manuscript://file-changed";

/// Must match the `shell:allow-execute` sidecar scope name in
/// `capabilities/default.json`. Note this is deliberately *not* the same
/// string as `tauri.conf.json`'s `bundle.externalBin` entry
/// (`binaries/mythoside-core`) — that path is where the build looks for the
/// *source* file to bundle (`src-tauri/binaries/mythoside-core-<target-triple>`,
/// produced by `scripts/prepare-sidecar.mjs`); at runtime, `tauri-plugin-shell`
/// resolves a sidecar relative to the running executable's own directory
/// with the triple stripped and no `binaries/` prefix — `target/debug/
/// mythoside-core` in dev (which a plain workspace `cargo build` already
/// produces, no copying needed there) and, per Tauri's bundling convention,
/// alongside the packaged app's own executable in a built app.
const SIDECAR_NAME: &str = "mythoside-core";

struct Inner {
    child: StdMutex<CommandChild>,
    pending: StdMutex<HashMap<u64, oneshot::Sender<Response>>>,
    next_id: AtomicU64,
}

/// A thin client for the local `mythoside-core` server process: spawns it as
/// a Tauri sidecar, speaks the stdin/stdout JSON-RPC protocol defined in
/// `mythoside_core::rpc`, and forwards its `"file-changed"` notifications as
/// Tauri events. All actual manuscript logic (parsing, file I/O, watching)
/// lives in that separate process — see CLAUDE.md.
#[derive(Clone)]
pub struct CoreClient(Arc<Inner>);

impl CoreClient {
    pub fn spawn(app: &AppHandle) -> Result<Self, String> {
        let (mut events, child) = app
            .shell()
            .sidecar(SIDECAR_NAME)
            .map_err(|e| e.to_string())?
            .spawn()
            .map_err(|e| e.to_string())?;

        let client = CoreClient(Arc::new(Inner {
            child: StdMutex::new(child),
            pending: StdMutex::new(HashMap::new()),
            next_id: AtomicU64::new(1),
        }));

        let reader_client = client.clone();
        let app_handle = app.clone();
        tauri::async_runtime::spawn(async move {
            while let Some(event) = events.recv().await {
                match event {
                    CommandEvent::Stdout(bytes) => {
                        let line = String::from_utf8_lossy(&bytes);
                        reader_client.handle_line(&app_handle, &line);
                    }
                    CommandEvent::Stderr(bytes) => {
                        eprintln!("mythoside-core: {}", String::from_utf8_lossy(&bytes));
                    }
                    CommandEvent::Error(err) => {
                        eprintln!("mythoside-core process error: {err}");
                    }
                    CommandEvent::Terminated(payload) => {
                        eprintln!("mythoside-core exited: {:?}", payload.code);
                        break;
                    }
                    _ => {}
                }
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
            let mut child = self.0.child.lock().unwrap();
            child.write(line.as_bytes()).map_err(|e| e.to_string())?;
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
    use mythoside_core::rpc::{Request, Response};
    use std::path::PathBuf;
    use std::process::Stdio;
    use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
    use tokio::process::Command;

    /// Locates the same sidecar binary `scripts/prepare-sidecar.mjs`
    /// produces, without going through Tauri's sidecar spawning (that needs
    /// a live `AppHandle`, which needs a `Runtime` generic this module
    /// doesn't carry — see the comment on `CoreClient`). This test isn't
    /// about whether Tauri's own sidecar plumbing works (that's Tauri's
    /// test suite's job); it's about whether the compiled binary actually
    /// speaks the shared `mythoside_core::rpc` protocol correctly over its
    /// own stdio, across a real process boundary.
    fn sidecar_binary_path() -> PathBuf {
        let output = std::process::Command::new("rustc")
            .arg("-vV")
            .output()
            .expect("rustc should be available");
        let stdout = String::from_utf8_lossy(&output.stdout);
        let triple = stdout
            .lines()
            .find_map(|line| line.strip_prefix("host: "))
            .expect("rustc -vV should report a host triple");

        let binary_name = if triple.contains("windows") {
            format!("mythoside-core-{triple}.exe")
        } else {
            format!("mythoside-core-{triple}")
        };

        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("binaries")
            .join(binary_name)
    }

    #[tokio::test]
    async fn spawns_the_real_core_binary_and_round_trips_a_request() {
        let binary_path = sidecar_binary_path();
        assert!(
            binary_path.exists(),
            "sidecar binary missing at {binary_path:?} — run `node scripts/prepare-sidecar.mjs` first"
        );
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
