use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

use crate::config::AppConfig;
use crate::storage::{file_manager, frontmatter, search};

fn err(code: &str, msg: impl std::fmt::Display) -> String {
    serde_json::json!({"code": code, "message": msg.to_string()}).to_string()
}

#[derive(Debug, Clone, Serialize)]
pub struct NoteMetadata {
    pub filename: String,
    pub path: String,
    pub created_at: String,
    pub tags: Vec<String>,
    pub body_preview: String,
}

#[derive(Debug, Serialize)]
pub struct ListNotesResult {
    pub notes: Vec<NoteMetadata>,
    pub total_count: u32,
}

#[derive(Debug, Serialize)]
pub struct SearchResultEntry {
    pub metadata: NoteMetadata,
    pub snippet: String,
    pub highlights: Vec<search::HighlightRange>,
}

#[derive(Debug, Serialize)]
pub struct SearchNotesResult {
    pub entries: Vec<SearchResultEntry>,
    pub total_count: u32,
}

fn get_notes_dir(config: &State<'_, Mutex<AppConfig>>) -> Result<PathBuf, String> {
    let cfg = config.lock().map_err(|e| err("INTERNAL", e))?;
    Ok(PathBuf::from(&cfg.notes_dir))
}

fn build_metadata(filename: &str, notes_dir: &Path, tags: Vec<String>, body: &str) -> NoteMetadata {
    let preview = if body.trim().chars().count() > 200 {
        body.trim().chars().take(200).collect::<String>() + "…"
    } else {
        body.trim().to_string()
    };
    NoteMetadata {
        filename: filename.to_string(),
        path: notes_dir.join(filename).to_string_lossy().into_owned(),
        created_at: file_manager::filename_to_created_at(filename),
        tags,
        body_preview: preview,
    }
}

use std::path::Path;

#[tauri::command]
pub fn create_note(config: State<'_, Mutex<AppConfig>>) -> Result<NoteMetadata, String> {
    let notes_dir = get_notes_dir(&config)?;
    let filename = file_manager::generate_filename(&notes_dir)
        .map_err(|e| err("STORAGE_WRITE_FAILED", e))?;
    let content = frontmatter::serialize_empty();
    let path = notes_dir.join(&filename);
    file_manager::write_file(&path, content)
        .map_err(|e| err("STORAGE_WRITE_FAILED", e))?;
    Ok(build_metadata(&filename, &notes_dir, vec![], ""))
}

#[tauri::command]
pub fn save_note(
    filename: String,
    content: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<NoteMetadata, String> {
    let notes_dir = get_notes_dir(&config)?;
    let path = file_manager::validate_path(&filename, &notes_dir)
        .map_err(|e| err("STORAGE_INVALID_FILENAME", e))?;
    let parsed = frontmatter::parse(&content);
    let normalized = frontmatter::reassemble(&parsed.tags, &parsed.body);
    file_manager::write_file(&path, &normalized)
        .map_err(|e| err("STORAGE_WRITE_FAILED", e))?;
    Ok(build_metadata(&filename, &notes_dir, parsed.tags, &parsed.body))
}

#[tauri::command]
pub fn read_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<serde_json::Value, String> {
    let notes_dir = get_notes_dir(&config)?;
    let path = file_manager::validate_path(&filename, &notes_dir)
        .map_err(|e| err("STORAGE_INVALID_FILENAME", e))?;
    if !path.exists() {
        return Err(err("STORAGE_NOT_FOUND", format!("Not found: {}", filename)));
    }
    let content = file_manager::read_file(&path)
        .map_err(|e| err("STORAGE_WRITE_FAILED", e))?;
    let parsed = frontmatter::parse(&content);
    Ok(serde_json::json!({"content": content, "tags": parsed.tags}))
}

#[tauri::command]
pub fn delete_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<serde_json::Value, String> {
    let notes_dir = get_notes_dir(&config)?;
    let path = file_manager::validate_path(&filename, &notes_dir)
        .map_err(|e| err("STORAGE_INVALID_FILENAME", e))?;
    if !path.exists() {
        return Err(err("STORAGE_NOT_FOUND", format!("Not found: {}", filename)));
    }
    trash::delete(&path).map_err(|e| err("TRASH_FAILED", e))?;
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub fn force_delete_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<serde_json::Value, String> {
    let notes_dir = get_notes_dir(&config)?;
    let path = file_manager::validate_path(&filename, &notes_dir)
        .map_err(|e| err("STORAGE_INVALID_FILENAME", e))?;
    if !path.exists() {
        return Err(err("STORAGE_NOT_FOUND", format!("Not found: {}", filename)));
    }
    std::fs::remove_file(&path).map_err(|e| err("STORAGE_WRITE_FAILED", e))?;
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub fn list_notes(
    from_date: Option<String>,
    to_date: Option<String>,
    tags: Vec<String>,
    limit: u32,
    offset: u32,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<ListNotesResult, String> {
    let notes_dir = get_notes_dir(&config)?;
    let files = file_manager::list_md_files(&notes_dir)
        .map_err(|e| err("STORAGE_WRITE_FAILED", e))?;

    let mut all: Vec<NoteMetadata> = Vec::new();
    for filename in &files {
        if !file_manager::filename_in_range(
            filename,
            from_date.as_deref(),
            to_date.as_deref(),
        ) {
            continue;
        }
        let path = notes_dir.join(filename);
        let content = match file_manager::read_file(&path) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let parsed = frontmatter::parse(&content);
        if !tags.is_empty() && !tags.iter().any(|t| parsed.tags.contains(t)) {
            continue;
        }
        all.push(build_metadata(filename, &notes_dir, parsed.tags, &parsed.body));
    }

    let total_count = all.len() as u32;
    let notes: Vec<NoteMetadata> = all
        .into_iter()
        .skip(offset as usize)
        .take(limit as usize)
        .collect();

    Ok(ListNotesResult { notes, total_count })
}

#[tauri::command]
pub fn search_notes(
    query: String,
    from_date: Option<String>,
    to_date: Option<String>,
    tags: Vec<String>,
    limit: u32,
    offset: u32,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<SearchNotesResult, String> {
    let notes_dir = get_notes_dir(&config)?;
    let tag_filter = if tags.is_empty() { None } else { Some(tags.as_slice()) };
    let matches = search::full_scan(
        &notes_dir,
        &query,
        from_date.as_deref(),
        to_date.as_deref(),
        tag_filter,
    )
    .map_err(|e| err("STORAGE_WRITE_FAILED", e))?;

    let total_count = matches.len() as u32;
    let entries: Vec<SearchResultEntry> = matches
        .into_iter()
        .skip(offset as usize)
        .take(limit as usize)
        .map(|m| {
            let metadata = build_metadata(
                &m.filename,
                &notes_dir,
                m.tags,
                &m.body_preview,
            );
            SearchResultEntry {
                metadata,
                snippet: m.snippet,
                highlights: m.highlights,
            }
        })
        .collect();

    Ok(SearchNotesResult {
        entries,
        total_count,
    })
}

#[tauri::command]
pub fn list_all_tags(config: State<'_, Mutex<AppConfig>>) -> Result<Vec<String>, String> {
    let notes_dir = get_notes_dir(&config)?;
    let files = file_manager::list_md_files(&notes_dir)
        .map_err(|e| err("STORAGE_WRITE_FAILED", e))?;

    let mut all_tags = std::collections::BTreeSet::new();
    for filename in &files {
        let path = notes_dir.join(filename);
        if let Ok(content) = file_manager::read_file(&path) {
            let parsed = frontmatter::parse(&content);
            for tag in parsed.tags {
                all_tags.insert(tag);
            }
        }
    }
    Ok(all_tags.into_iter().collect())
}

#[tauri::command]
pub fn move_notes(
    old_notes_dir: String,
    new_notes_dir: String,
) -> Result<serde_json::Value, String> {
    let old = PathBuf::from(&old_notes_dir);
    let new = PathBuf::from(&new_notes_dir);
    let mut moved = 0u32;
    let mut skipped = 0u32;

    if let Ok(entries) = std::fs::read_dir(&old) {
        for entry in entries.filter_map(|e| e.ok()) {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if !file_manager::is_valid_filename(&name_str) {
                continue;
            }
            let dest = new.join(&name);
            if dest.exists() {
                skipped += 1;
                continue;
            }
            if std::fs::rename(entry.path(), &dest).is_ok() {
                moved += 1;
            } else {
                skipped += 1;
            }
        }
    }
    Ok(serde_json::json!({"moved": moved, "skipped": skipped}))
}
