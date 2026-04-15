#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod storage;

use std::sync::Mutex;
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub struct AppDataDir(pub std::path::PathBuf);

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app_data_dir");
            let cfg = config::load_or_create(&app_data_dir)
                .expect("Failed to load config");
            std::fs::create_dir_all(&cfg.notes_dir).ok();
            app.manage(Mutex::new(cfg));
            app.manage(AppDataDir(app_data_dir));

            // Global shortcut: CmdOrCtrl+N
            #[cfg(target_os = "macos")]
            let modifier = Modifiers::SUPER;
            #[cfg(not(target_os = "macos"))]
            let modifier = Modifiers::CONTROL;

            let shortcut = Shortcut::new(Some(modifier), Code::KeyN);
            app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.emit("new-note", ());
                    }
                }
            })?;

            // Window close handler for auto-save
            let handle = app.handle().clone();
            if let Some(window) = app.get_webview_window("main") {
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(w) = handle.get_webview_window("main") {
                            let _ = w.emit("before-close", ());
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::notes::create_note,
            commands::notes::save_note,
            commands::notes::delete_note,
            commands::notes::force_delete_note,
            commands::notes::read_note,
            commands::notes::list_notes,
            commands::notes::search_notes,
            commands::notes::list_all_tags,
            commands::notes::move_notes,
            commands::config::get_config,
            commands::config::set_config,
            commands::clipboard::copy_to_clipboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
