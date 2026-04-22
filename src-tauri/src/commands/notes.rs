use crate::config::AppConfig;
use crate::error::{CommandResult, TauriCommandError};
use crate::storage::file_manager::FileManager;
use crate::storage::frontmatter;
use crate::storage::search;
use serde::{Deserialize, Serialize};
use std::io;
use std::path::Path;
use std::sync::Mutex;
use tauri::State;

pub use search::{HighlightRange, NoteMetadata, SearchNotesResult, SearchResultEntry};

#[derive(Debug, Serialize, Deserialize)]
pub struct ListNotesResult {
    pub notes: Vec<NoteMetadata>,
    pub total_count: usize,
}

fn build_metadata(filename: &str, content: &str) -> NoteMetadata {
    let parsed = frontmatter::parse(content);
    let body = frontmatter::extract_body(content);

    let created_at = crate::storage::file_manager::filename_to_datetime(filename)
        .unwrap_or_default();

    NoteMetadata {
        filename: filename.to_string(),
        title: String::new(),
        tags: parsed.tags,
        created_at: created_at.clone(),
        updated_at: created_at,
        body_preview: body.to_string(),
    }
}

fn map_io_write_err(e: io::Error, filename: &str) -> TauriCommandError {
    if e.kind() == io::ErrorKind::InvalidInput {
        TauriCommandError::storage_invalid_filename(format!(
            "Invalid filename '{}': {}",
            filename,
            e
        ))
    } else {
        TauriCommandError::storage_write_failed(e.to_string())
    }
}

fn map_io_read_err(e: io::Error, filename: &str) -> TauriCommandError {
    match e.kind() {
        io::ErrorKind::NotFound => {
            TauriCommandError::storage_not_found(format!("File not found: {}", filename))
        }
        io::ErrorKind::InvalidInput => {
            TauriCommandError::storage_invalid_filename(format!(
                "Invalid filename '{}': {}",
                filename,
                e
            ))
        }
        _ => TauriCommandError::storage_read_failed(e.to_string()),
    }
}

#[tauri::command]
pub fn create_note(
    tags: Vec<String>,
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<NoteMetadata> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let fm = FileManager::new(&cfg.notes_directory);
    let filename = fm.generate_filename();
    let content = frontmatter::generate(&tags, "");
    fm.write(&filename, &content)
        .map_err(|e| map_io_write_err(e, &filename))?;
    Ok(build_metadata(&filename, &content))
}

#[tauri::command]
pub fn save_note(
    filename: String,
    raw_content: String,
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<NoteMetadata> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.write(&filename, &raw_content)
        .map_err(|e| map_io_write_err(e, &filename))?;
    Ok(build_metadata(&filename, &raw_content))
}

#[tauri::command]
pub fn read_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<String> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.read(&filename).map_err(|e| map_io_read_err(e, &filename))
}

#[tauri::command]
pub fn list_notes(
    offset: usize,
    limit: usize,
    tags: Option<Vec<String>>,
    from_date: Option<String>,
    to_date: Option<String>,
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<ListNotesResult> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let fm = FileManager::new(&cfg.notes_directory);
    let all_files = fm
        .list_files()
        .map_err(|e| TauriCommandError::storage_read_failed(e.to_string()))?;

    let mut notes: Vec<NoteMetadata> = Vec::new();
    for filename in &all_files {
        let content = match fm.read(filename) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let meta = build_metadata(filename, &content);

        // Filter by tags
        if let Some(ref filter_tags) = tags {
            if !filter_tags.iter().all(|t| meta.tags.contains(t)) {
                continue;
            }
        }

        // Filter by date range
        if let Some(ref from) = from_date {
            if meta.created_at < *from {
                continue;
            }
        }
        if let Some(ref to) = to_date {
            if meta.created_at > *to {
                continue;
            }
        }

        notes.push(meta);
    }

    // Sort by created_at descending
    notes.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    let total_count = notes.len();
    let paginated: Vec<NoteMetadata> = notes.into_iter().skip(offset).take(limit).collect();

    Ok(ListNotesResult {
        notes: paginated,
        total_count,
    })
}

#[tauri::command]
pub fn search_notes(
    query: String,
    offset: Option<u32>,
    limit: Option<u32>,
    from_date: Option<String>,
    to_date: Option<String>,
    tags: Option<Vec<String>>,
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<SearchNotesResult> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let opts = search::SearchOptions { query, from_date, to_date, tags, limit, offset };
    search::full_scan(Path::new(&cfg.notes_directory), &opts)
        .map_err(|e| TauriCommandError::storage_read_failed(e))
}

#[tauri::command]
pub fn trash_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<()> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let fm = FileManager::new(&cfg.notes_directory);
    let path = fm.file_path(&filename);
    trash::delete(&path).map_err(|e| TauriCommandError::trash_failed(e.to_string()))
}

#[tauri::command]
pub fn force_delete_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<()> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.delete(&filename)
        .map_err(|e| TauriCommandError::storage_write_failed(e.to_string()))
}

#[tauri::command]
pub fn list_all_tags(
    config: State<'_, Mutex<AppConfig>>,
) -> CommandResult<Vec<String>> {
    let cfg = config.lock().map_err(|_| TauriCommandError::internal("config lock poisoned"))?;
    let fm = FileManager::new(&cfg.notes_directory);
    let all_files = fm
        .list_files()
        .map_err(|e| TauriCommandError::storage_read_failed(e.to_string()))?;

    let mut tag_set: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();
    for filename in &all_files {
        let content = match fm.read(filename) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let parsed = frontmatter::parse(&content);
        for tag in parsed.tags {
            tag_set.insert(tag);
        }
    }

    Ok(tag_set.into_iter().collect())
}

