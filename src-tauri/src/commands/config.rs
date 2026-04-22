use crate::config::{self, AppConfig};
use crate::error::{CommandResult, TauriCommandError};
use crate::storage::file_manager::FileManager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub fn get_config(
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<AppConfig> {
    let cfg = config.lock()
        .map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    Ok(cfg.clone())
}

#[tauri::command]
pub fn pick_notes_directory(app: AppHandle) -> CommandResult<Option<String>> {
    let picked = app.dialog().file().blocking_pick_folder();
    let Some(file_path) = picked else { return Ok(None); };
    // FilePath is an enum: Path(PathBuf) | Url(url::Url)
    let raw_path: PathBuf = match file_path {
        tauri_plugin_fs::FilePath::Path(p) => p,
        tauri_plugin_fs::FilePath::Url(u) => {
            u.to_file_path()
                .map_err(|_| TauriCommandError::config_invalid_dir("cannot convert URL to path"))?
        }
    };
    let canonical = config::validate_notes_directory(&raw_path)?;
    Ok(Some(canonical.to_string_lossy().to_string()))
}

#[derive(Debug, Deserialize)]
pub struct SetConfigParams {
    pub notes_dir: String,
    pub move_existing: bool,
}

#[derive(Debug, Serialize)]
pub struct SetConfigResult {
    pub moved_count: usize,
    pub remaining_in_old: usize,
}

#[tauri::command]
pub fn set_config(
    params: SetConfigParams,
    config: State<'_, Mutex<AppConfig>>,
    app: AppHandle,
) -> CommandResult<SetConfigResult> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| TauriCommandError::internal(format!("app_data_dir: {}", e)))?;

    let new_dir = Path::new(&params.notes_dir).to_path_buf();

    // Phase 0: 再 validate (TOCTOU 対策)
    let new_dir_canonical = config::validate_notes_directory(&new_dir)?;

    let old_dir_str = {
        let cfg = config.lock()
            .map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
        cfg.notes_directory.clone()
    };
    let old_dir = PathBuf::from(&old_dir_str);

    // 同一ディレクトリなら早期リターン
    if old_dir == new_dir_canonical {
        return Ok(SetConfigResult { moved_count: 0, remaining_in_old: 0 });
    }

    // Phase 1: move_existing=true の場合、旧 → 新 へコピー
    let mut copied_files: Vec<PathBuf> = Vec::new();
    if params.move_existing {
        let old_fm = FileManager::new(&old_dir_str);
        if let Ok(files) = old_fm.list_files() {
            // 衝突検出
            let mut conflicts: Vec<String> = Vec::new();
            for filename in &files {
                let dst = new_dir_canonical.join(filename);
                if dst.exists() {
                    conflicts.push(filename.clone());
                }
            }
            if !conflicts.is_empty() {
                return Err(TauriCommandError::new(
                    "MOVE_CONFLICT",
                    format!("conflicting files: {}", conflicts.join(", ")),
                ));
            }

            for filename in &files {
                let src = old_dir.join(filename);
                let dst = new_dir_canonical.join(filename);
                match fs::copy(&src, &dst) {
                    Ok(_) => copied_files.push(dst),
                    Err(e) => {
                        // ロールバック: コピー済みファイルを削除
                        for f in &copied_files {
                            let _ = fs::remove_file(f);
                        }
                        return Err(TauriCommandError::storage_write_failed(format!(
                            "copy {}: {}",
                            filename, e
                        )));
                    }
                }
            }
        }
    }

    // Phase 2: config.json atomic write (point of no return)
    let new_cfg = AppConfig {
        notes_directory: new_dir_canonical.to_string_lossy().to_string(),
    };
    if let Err(e) = new_cfg.save(&app_data_dir) {
        // ロールバック: コピー済みファイルを削除
        for f in &copied_files {
            let _ = fs::remove_file(f);
        }
        return Err(e);
    }

    // in-memory 更新
    {
        let mut cfg = config.lock()
            .map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
        *cfg = new_cfg;
    }

    // Phase 3: move_existing=true の場合、旧 → 削除
    let mut remaining_in_old = 0usize;
    let moved_count = copied_files.len();
    if params.move_existing {
        for dst in &copied_files {
            let filename = dst.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let src = old_dir.join(filename);
            if fs::remove_file(&src).is_err() {
                remaining_in_old += 1;
            }
        }
    }

    Ok(SetConfigResult { moved_count, remaining_in_old })
}
