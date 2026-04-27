mod commands;
mod config;
mod error;
mod notes;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();
            // Ensure notes directory exists on startup
            if let Err(e) = config::ensure_notes_dir(&app_handle) {
                let msg = format!("Failed to initialize notes directory: {}", e);
                eprintln!("{}", msg);
                // Store error for frontend to query
                app.manage(commands::StartupError(Some(msg)));
            } else {
                app.manage(commands::StartupError(None));
            }

            // Initialize a single long-lived clipboard handle. On Linux this
            // keeps the X11 selection-server thread alive across IPC calls so
            // that a `set_text` followed by an out-of-process paste works.
            match arboard::Clipboard::new() {
                Ok(cb) => {
                    app.manage(commands::ClipboardManager(std::sync::Mutex::new(cb)));
                }
                Err(e) => {
                    eprintln!("Failed to initialize clipboard: {}", e);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::create_note,
            commands::save_note,
            commands::read_note,
            commands::list_notes,
            commands::search_notes,
            commands::get_config,
            commands::set_config,
            commands::pick_notes_directory,
            commands::trash_note,
            commands::force_delete_note,
            commands::copy_to_clipboard,
            commands::read_from_clipboard,
            commands::list_all_tags,
            commands::get_startup_error,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
