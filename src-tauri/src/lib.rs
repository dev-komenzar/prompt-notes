// Sprint 23-30 – Rust backend: Tauri IPC commands for file operations
// All file I/O happens here; frontend communicates via invoke()

mod commands;
mod config;
mod notes;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Ensure config is initialized on startup
            let app_handle = app.handle().clone();
            config::init_config(&app_handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_note,
            commands::save_note,
            commands::read_note,
            commands::delete_note,
            commands::list_notes,
            commands::search_notes,
            commands::get_config,
            commands::set_config,
            commands::get_all_tags,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
