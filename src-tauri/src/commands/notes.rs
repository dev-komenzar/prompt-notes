use crate::config::AppConfig;
use crate::storage::file_manager::FileManager;
use crate::storage::frontmatter;
use crate::storage::search;
use serde::{Deserialize, Serialize};
use tauri::State;
use std::path::Path;
use std::sync::Mutex;

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

#[tauri::command]
pub fn create_note(
    tags: Vec<String>,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<NoteMetadata, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let filename = fm.generate_filename();
    let content = frontmatter::generate(&tags, "");
    fm.write(&filename, &content).map_err(|e| e.to_string())?;
    Ok(build_metadata(&filename, &content))
}

#[tauri::command]
pub fn save_note(
    filename: String,
    raw_content: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<NoteMetadata, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.write(&filename, &raw_content)
        .map_err(|e| e.to_string())?;
    Ok(build_metadata(&filename, &raw_content))
}

#[tauri::command]
pub fn read_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<String, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.read(&filename).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_notes(
    offset: usize,
    limit: usize,
    tags: Option<Vec<String>>,
    from_date: Option<String>,
    to_date: Option<String>,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<ListNotesResult, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let all_files = fm.list_files().map_err(|e| e.to_string())?;

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
) -> Result<SearchNotesResult, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let opts = search::SearchOptions { query, from_date, to_date, tags, limit, offset };
    search::full_scan(Path::new(&cfg.notes_directory), &opts)
}

#[tauri::command]
pub fn trash_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<(), String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let path = fm.file_path(&filename);
    trash::delete(&path).map_err(|e| format!("TrashNotAvailable: {}", e))
}

#[tauri::command]
pub fn force_delete_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<(), String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.delete(&filename).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_all_tags(
    config: State<'_, Mutex<AppConfig>>,
) -> Result<Vec<String>, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let all_files = fm.list_files().map_err(|e| e.to_string())?;

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

#[tauri::command]
pub fn move_notes(
    from_dir: String,
    to_dir: String,
) -> Result<usize, String> {
    let from_fm = FileManager::new(&from_dir);
    let to_fm = FileManager::new(&to_dir);

    to_fm.ensure_directory().map_err(|e| e.to_string())?;

    let files = from_fm.list_files().map_err(|e| e.to_string())?;
    let mut moved = 0;

    for filename in &files {
        let content = from_fm.read(filename).map_err(|e| e.to_string())?;
        to_fm.write(filename, &content).map_err(|e| e.to_string())?;
        from_fm.delete(filename).map_err(|e| e.to_string())?;
        moved += 1;
    }

    Ok(moved)
}
