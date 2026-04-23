pub mod commands;
pub mod config;
pub mod error;
pub mod storage;

use commands::clipboard::copy_to_clipboard;
use commands::config::{get_config, get_startup_error, pick_notes_directory, set_config};
use commands::notes::{
    create_note, force_delete_note, list_all_tags, list_notes, read_note, save_note,
    search_notes, trash_note,
};
use config::AppConfig;
use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("new-note", ());
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app_data_dir from identifier com.promptnotes");
            std::fs::create_dir_all(&app_data_dir).ok();
            let (cfg, startup_error): (AppConfig, Option<String>) = match AppConfig::from_app_data_dir(&app_data_dir) {
                Ok(c) => (c, None),
                Err(e) => {
                    // Fall back to default so the app can start; expose error via IPC
                    let default_cfg = AppConfig {
                        notes_directory: app_data_dir.join("notes").to_string_lossy().to_string(),
                    };
                    (default_cfg, Some(e))
                }
            };
            std::fs::create_dir_all(&cfg.notes_directory).ok();
            app.manage(Mutex::new(cfg));
            app.manage(Mutex::new(startup_error));

            // Register global shortcuts at startup (platform-aware CmdOrCtrl+N)
            #[cfg(target_os = "macos")]
            app.global_shortcut()
                .register("Super+KeyN")
                .expect("failed to register Super+KeyN shortcut");
            #[cfg(not(target_os = "macos"))]
            app.global_shortcut()
                .register("Control+KeyN")
                .expect("failed to register Control+KeyN shortcut");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_note,
            save_note,
            read_note,
            list_notes,
            list_all_tags,
            search_notes,
            get_config,
            pick_notes_directory,
            set_config,
            trash_note,
            force_delete_note,
            copy_to_clipboard,
            get_startup_error,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PromptNotes");
}
