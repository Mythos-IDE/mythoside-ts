use crate::core_client::CoreClient;
use mythoside_core::manuscript::commands::{
    BookHandle, CreateBookInput, CreateCharacterInput, CreateLocationInput, CreateNoteInput,
    CreateSeriesInput, CreateSeriesOutput, ListBooksOutput, ListCharactersOutput,
    ListLocationsOutput, ListNotesOutput, ListSeriesOutput, UpdateSeriesInput,
};
use mythoside_core::manuscript::models::{Character, Location, Note, Series};
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
pub async fn create_series(
    core: State<'_, CoreClient>,
    input: CreateSeriesInput,
) -> Result<CreateSeriesOutput, String> {
    let params = serde_json::to_value(input).map_err(|e| e.to_string())?;
    let result = core.call("create_series", params).await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_series(
    core: State<'_, CoreClient>,
    project_dir: String,
) -> Result<Series, String> {
    let result = core
        .call("get_series", json!({ "projectDir": project_dir }))
        .await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_series(core: State<'_, CoreClient>) -> Result<ListSeriesOutput, String> {
    let result = core.call("list_series", serde_json::Value::Null).await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_series(
    core: State<'_, CoreClient>,
    input: UpdateSeriesInput,
) -> Result<Series, String> {
    let params = serde_json::to_value(input).map_err(|e| e.to_string())?;
    let result = core.call("update_series", params).await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_book(
    core: State<'_, CoreClient>,
    input: CreateBookInput,
) -> Result<BookHandle, String> {
    let params = serde_json::to_value(input).map_err(|e| e.to_string())?;
    let result = core.call("create_book", params).await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_books(
    core: State<'_, CoreClient>,
    project_dir: String,
) -> Result<ListBooksOutput, String> {
    let result = core
        .call("list_books", json!({ "projectDir": project_dir }))
        .await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_location(
    core: State<'_, CoreClient>,
    input: CreateLocationInput,
) -> Result<Location, String> {
    let params = serde_json::to_value(input).map_err(|e| e.to_string())?;
    let result = core.call("create_location", params).await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_locations(
    core: State<'_, CoreClient>,
    project_dir: String,
) -> Result<ListLocationsOutput, String> {
    let result = core
        .call("list_locations", json!({ "projectDir": project_dir }))
        .await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_characters(
    core: State<'_, CoreClient>,
    project_dir: String,
) -> Result<ListCharactersOutput, String> {
    let result = core
        .call("list_characters", json!({ "projectDir": project_dir }))
        .await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_note(
    core: State<'_, CoreClient>,
    input: CreateNoteInput,
) -> Result<Note, String> {
    let params = serde_json::to_value(input).map_err(|e| e.to_string())?;
    let result = core.call("create_note", params).await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_notes(
    core: State<'_, CoreClient>,
    project_dir: String,
) -> Result<ListNotesOutput, String> {
    let result = core
        .call("list_notes", json!({ "projectDir": project_dir }))
        .await?;
    serde_json::from_value(result).map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_series(core: State<'_, CoreClient>, project_dir: String) -> Result<(), String> {
    core.call("delete_series", json!({ "projectDir": project_dir }))
        .await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_book(core: State<'_, CoreClient>, book_dir: String) -> Result<(), String> {
    core.call("delete_book", json!({ "bookDir": book_dir }))
        .await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_character(
    core: State<'_, CoreClient>,
    project_dir: String,
    character_id: String,
) -> Result<(), String> {
    core.call(
        "delete_character",
        json!({ "projectDir": project_dir, "characterId": character_id }),
    )
    .await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_location(
    core: State<'_, CoreClient>,
    project_dir: String,
    location_id: String,
) -> Result<(), String> {
    core.call(
        "delete_location",
        json!({ "projectDir": project_dir, "locationId": location_id }),
    )
    .await?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_note(
    core: State<'_, CoreClient>,
    project_dir: String,
    note_id: String,
) -> Result<(), String> {
    core.call(
        "delete_note",
        json!({ "projectDir": project_dir, "noteId": note_id }),
    )
    .await?;
    Ok(())
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
