mod commands;
mod core_client;

use core_client::CoreClient;
use tauri::Manager;
use tauri_specta::{collect_commands, Builder};

fn specta_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::start_watching,
        commands::stop_watching,
        commands::create_character,
    ])
}

const BINDINGS_PATH: &str = "../src/bindings.ts";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = specta_builder();

    // TS bindings are regenerated on every debug build so they can never
    // drift from the Rust command/type definitions — see CLAUDE.md. Also
    // exported from a plain `cargo test` (below), since running the full
    // windowed app isn't needed (or always possible, e.g. headless CI) just
    // to regenerate bindings.
    #[cfg(debug_assertions)]
    builder
        .export(specta_typescript::Typescript::default(), BINDINGS_PATH)
        .expect("failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            let core_client = CoreClient::spawn(&app.handle().clone())?;
            app.manage(core_client);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exports_typescript_bindings() {
        specta_builder()
            .export(specta_typescript::Typescript::default(), BINDINGS_PATH)
            .expect("failed to export typescript bindings");
    }
}
