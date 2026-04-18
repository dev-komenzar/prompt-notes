pub mod commands;
pub mod config;
pub mod storage;

use commands::clipboard::{copy_to_clipboard, read_from_clipboard};
use commands::config::{get_config, set_config};
use commands::notes::{
    create_note, force_delete_note, list_notes, move_notes, read_note, save_note, search_notes,
    trash_note,
};
use config::AppConfig;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AppConfig::load()))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            create_note,
            save_note,
            read_note,
            list_notes,
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
