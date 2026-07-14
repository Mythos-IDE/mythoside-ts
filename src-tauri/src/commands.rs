use crate::core_client::CoreClient;
use mythoside_core::manuscript::commands::CreateCharacterInput;
use mythoside_core::manuscript::models::Character;
use serde_json::json;
use tauri::State;

/// These commands do no work themselves — they serialize their arguments,
/// send them to the local `mythoside-core` process over stdio, and
/// deserialize its response back into the same Rust types `mythoside-core`
/// defines (reused directly, not redeclared — see CLAUDE.md). All of them
/// keep the exact signature the frontend already calls through
/// `src/bindings.ts`; only what happens *inside* changed.

#[tauri::command]
#[specta::specta]
pub async fn create_character(
    core: State<'_, CoreClient>,
    input: CreateCharacterInput,
) -> Result<Character, String> {
    let params = serde_json::to_value(input).map_err(|e| e.to_string())?;
    let result = core.call("create_character", params).await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn start_watching(core: State<'_, CoreClient>, path: String) -> Result<(), String> {
    core.call("start_watching", json!({ "path": path })).await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn stop_watching(core: State<'_, CoreClient>) -> Result<(), String> {
    core.call("stop_watching", serde_json::Value::Null).await?;
    Ok(())
}
