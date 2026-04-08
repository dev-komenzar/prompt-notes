// Note file operations: create, read, save, delete, list, search
use chrono::{Local, NaiveDateTime};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use crate::config;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteEntry {
    pub filename: String,
    pub path: String,
    pub created_at: String,
    pub modified_at: String,
    pub tags: Vec<String>,
    pub title: String,
    pub preview: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNoteResult {
    pub filename: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ListNotesParams {
    pub from: Option<String>,
    pub to: Option<String>,
    pub tags: Option<Vec<String>>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchNotesParams {
    pub query: String,
    pub from: Option<String>,
    pub to: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Generate a filename in YYYY-MM-DDTHHMMSS.md format with _N collision suffix
fn generate_filename(dir: &Path) -> Result<String, String> {
    let now = Local::now();
    let base = now.format("%Y-%m-%dT%H%M%S").to_string();
    let candidate = format!("{}.md", base);

    if !dir.join(&candidate).exists() {
        return Ok(candidate);
    }

    // Handle collision with _N suffix
    for n in 1..100 {
        let candidate = format!("{}_{}.md", base, n);
        if !dir.join(&candidate).exists() {
            return Ok(candidate);
        }
    }

    Err("Too many filename collisions".to_string())
}

/// Parse the created_at timestamp from the filename
fn parse_created_at(filename: &str) -> Option<String> {
    // Expected: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md
    let stem = filename.strip_suffix(".md")?;
    let base = if let Some(idx) = stem.rfind('_') {
        // Check if suffix after _ is a number (collision suffix)
        let suffix = &stem[idx + 1..];
        if suffix.chars().all(|c| c.is_ascii_digit()) {
            &stem[..idx]
        } else {
            stem
        }
    } else {
        stem
    };

    // Parse YYYY-MM-DDTHHMMSS
    if base.len() == 17 {
        let formatted = format!(
            "{}-{}-{}T{}:{}:{}",
            &base[0..4],
            &base[5..7],
            &base[8..10],
            &base[11..13],
            &base[13..15],
            &base[15..17]
        );
        Some(formatted)
    } else {
        None
    }
}

/// Extract YAML frontmatter tags from note content
fn extract_tags(content: &str) -> Vec<String> {
    if !content.starts_with("---\n") && !content.starts_with("---\r\n") {
        return vec![];
    }

    let open_len = if content.starts_with("---\r\n") { 5 } else { 4 };
    let rest = &content[open_len..];

    let close_idx = rest.find("\n---");
    if close_idx.is_none() {
        return vec![];
    }

    let fm = &rest[..close_idx.unwrap()];

    // Try bracket format: tags: ["a", "b"]
    if let Some(caps) = fm.find("tags:") {
        let line = &fm[caps..];
        if let Some(bracket_start) = line.find('[') {
            if let Some(bracket_end) = line.find(']') {
                let inner = &line[bracket_start + 1..bracket_end];
                return inner
                    .split(',')
                    .map(|t| t.trim().trim_matches(|c| c == '"' || c == '\'').to_string())
                    .filter(|t| !t.is_empty())
                    .collect();
            }
        }

        // Try list format: tags:\n  - item
        let mut tags = vec![];
        let mut in_tags = false;
        for line in fm.lines() {
            if line.starts_with("tags:") {
                in_tags = true;
                continue;
            }
            if in_tags {
                let trimmed = line.trim();
                if trimmed.starts_with("- ") {
                    tags.push(
                        trimmed[2..]
                            .trim()
                            .trim_matches(|c| c == '"' || c == '\'')
                            .to_string(),
                    );
                } else if !trimmed.is_empty() {
                    break;
                }
            }
        }
        if !tags.is_empty() {
            return tags;
        }
    }

    vec![]
}

/// Extract body text (everything after frontmatter)
fn extract_body(content: &str) -> &str {
    if !content.starts_with("---\n") && !content.starts_with("---\r\n") {
        return content;
    }
    let open_len = if content.starts_with("---\r\n") { 5 } else { 4 };
    let rest = &content[open_len..];
    if let Some(close_idx) = rest.find("\n---") {
        let after = close_idx + 4; // "\n---".len()
        let body_start = if after < rest.len() {
            if rest.as_bytes().get(after) == Some(&b'\n') {
                after + 1
            } else if rest.as_bytes().get(after) == Some(&b'\r') {
                after + 2
            } else {
                after
            }
        } else {
            after
        };
        if body_start < rest.len() {
            return rest[body_start..].trim_start();
        }
        return "";
    }
    content
}

/// Extract the first non-empty line of body as title
fn extract_title(content: &str) -> String {
    let body = extract_body(content);
    body.lines()
        .find(|l| !l.trim().is_empty())
        .unwrap_or("")
        .trim()
        .chars()
        .take(100)
        .collect()
}

/// Generate a preview of the body (first ~200 chars)
fn extract_preview(content: &str) -> String {
    let body = extract_body(content);
    body.chars().take(200).collect()
}

/// Build a NoteEntry from a file path
fn build_note_entry(path: &Path) -> Result<NoteEntry, String> {
    let filename = path
        .file_name()
        .ok_or("Invalid filename")?
        .to_string_lossy()
        .to_string();

    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    let modified_at = metadata
        .modified()
        .map(|t| {
            let datetime: chrono::DateTime<Local> = t.into();
            datetime.to_rfc3339()
        })
        .unwrap_or_default();

    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;

    let created_at = parse_created_at(&filename).unwrap_or_else(|| modified_at.clone());
    let tags = extract_tags(&content);
    let title = extract_title(&content);
    let preview = extract_preview(&content);

    Ok(NoteEntry {
        filename,
        path: path.to_string_lossy().to_string(),
        created_at,
        modified_at,
        tags,
        title,
        preview,
        size: metadata.len(),
    })
}

pub fn create_note(content: Option<String>, _tags: Option<Vec<String>>) -> Result<CreateNoteResult, String> {
    let dir = config::get_notes_directory()?;
    let filename = generate_filename(&dir)?;
    let path = dir.join(&filename);

    let note_content = content.unwrap_or_else(|| {
        "---\ntags: []\n---\n\n".to_string()
    });

    fs::write(&path, &note_content).map_err(|e| e.to_string())?;

    Ok(CreateNoteResult {
        filename,
        path: path.to_string_lossy().to_string(),
    })
}

pub fn save_note(filename: &str, content: &str) -> Result<(), String> {
    let dir = config::get_notes_directory()?;
    let path = dir.join(filename);
    if !path.exists() {
        return Err(format!("Note not found: {}", filename));
    }
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn read_note(filename: &str) -> Result<String, String> {
    let dir = config::get_notes_directory()?;
    let path = dir.join(filename);
    if !path.exists() {
        return Err(format!("Note not found: {}", filename));
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

pub fn delete_note(filename: &str) -> Result<(), String> {
    let dir = config::get_notes_directory()?;
    let path = dir.join(filename);
    if !path.exists() {
        return Err(format!("Note not found: {}", filename));
    }
    fs::remove_file(&path).map_err(|e| e.to_string())?;
    Ok(())
}

/// Check if a date string (from filename) falls within the from/to range
fn date_in_range(created_at: &str, from: &Option<String>, to: &Option<String>) -> bool {
    // created_at is like "2025-01-15T14:30:22" or RFC3339
    let date_part: &str = if created_at.len() >= 10 {
        &created_at[..10]
    } else {
        return true; // Can't parse, include it
    };

    if let Some(from_date) = from {
        if date_part < from_date.as_str() {
            return false;
        }
    }
    if let Some(to_date) = to {
        if date_part > to_date.as_str() {
            return false;
        }
    }
    true
}

/// Check if a note has all the required tags
fn has_required_tags(note_tags: &[String], required: &Option<Vec<String>>) -> bool {
    match required {
        None => true,
        Some(req) => req.iter().all(|t| note_tags.contains(t)),
    }
}

pub fn list_notes(params: ListNotesParams) -> Result<Vec<NoteEntry>, String> {
    let dir = config::get_notes_directory()?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut entries: Vec<NoteEntry> = vec![];

    let read_dir = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().map(|e| e == "md").unwrap_or(false) {
            if let Ok(note) = build_note_entry(&path) {
                if !date_in_range(&note.created_at, &params.from, &params.to) {
                    continue;
                }
                if !has_required_tags(&note.tags, &params.tags) {
                    continue;
                }
                entries.push(note);
            }
        }
    }

    // Sort
    let sort_by = params.sort_by.as_deref().unwrap_or("created");
    let sort_desc = params.sort_order.as_deref().unwrap_or("desc") == "desc";

    entries.sort_by(|a, b| {
        let cmp = match sort_by {
            "modified" => a.modified_at.cmp(&b.modified_at),
            _ => a.created_at.cmp(&b.created_at),
        };
        if sort_desc {
            cmp.reverse()
        } else {
            cmp
        }
    });

    Ok(entries)
}

pub fn search_notes(params: SearchNotesParams) -> Result<Vec<NoteEntry>, String> {
    let dir = config::get_notes_directory()?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let query_lower = params.query.to_lowercase();
    let mut results: Vec<NoteEntry> = vec![];

    let read_dir = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().map(|e| e == "md").unwrap_or(false) {
            if let Ok(content) = fs::read_to_string(&path) {
                if content.to_lowercase().contains(&query_lower) {
                    if let Ok(note) = build_note_entry(&path) {
                        if !date_in_range(&note.created_at, &params.from, &params.to) {
                            continue;
                        }
                        if !has_required_tags(&note.tags, &params.tags) {
                            continue;
                        }
                        results.push(note);
                    }
                }
            }
        }
    }

    // Sort by created descending
    results.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(results)
}

pub fn get_all_tags() -> Result<Vec<String>, String> {
    let dir = config::get_notes_directory()?;
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut all_tags: std::collections::BTreeSet<String> = std::collections::BTreeSet::new();

    let read_dir = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().map(|e| e == "md").unwrap_or(false) {
            if let Ok(content) = fs::read_to_string(&path) {
                for tag in extract_tags(&content) {
                    all_tags.insert(tag);
                }
            }
        }
    }

    Ok(all_tags.into_iter().collect())
}
