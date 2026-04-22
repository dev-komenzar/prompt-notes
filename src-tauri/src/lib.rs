pub mod commands;
pub mod config;
pub mod storage;

use commands::clipboard::{copy_to_clipboard, read_from_clipboard};
use commands::config::{get_config, set_config};
use commands::notes::{
    create_note, force_delete_note, list_all_tags, list_notes, move_notes, read_note, save_note,
    search_notes, trash_note,
};
use config::AppConfig;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app_data_dir from identifier com.promptnotes");
            std::fs::create_dir_all(&app_data_dir).ok();
            let cfg = AppConfig::from_app_data_dir(&app_data_dir);
            std::fs::create_dir_all(&cfg.notes_directory).ok();
            app.manage(Mutex::new(cfg));
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
            set_config,
            move_notes,
            trash_note,
            force_delete_note,
            copy_to_clipboard,
            read_from_clipboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PromptNotes");
}
