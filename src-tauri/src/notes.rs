use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use crate::error::CommandError;

const FILENAME_REGEX: &str = r"^\d{4}-\d{2}-\d{2}T\d{6}\.md$";
const BODY_PREVIEW_LEN: usize = 200;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NoteMetadata {
    pub filename: String,
    pub title: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub body_preview: String,
}

#[derive(Debug, Serialize)]
pub struct ListNotesResult {
    pub notes: Vec<NoteMetadata>,
    pub total_count: usize,
}

#[derive(Debug, Serialize)]
pub struct SearchResultEntry {
    pub metadata: NoteMetadata,
    pub snippet: String,
    pub highlights: Vec<HighlightRange>,
}

#[derive(Debug, Serialize)]
pub struct SearchNotesResult {
    pub entries: Vec<SearchResultEntry>,
    pub total_count: usize,
}

#[derive(Debug, Serialize)]
pub struct HighlightRange {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Deserialize)]
struct Frontmatter {
    #[serde(default)]
    tags: Vec<String>,
}

/// Validate a note filename against the expected pattern
pub fn validate_filename(filename: &str) -> Result<(), CommandError> {
    let re = regex_lite::Regex::new(FILENAME_REGEX).unwrap();
    if !re.is_match(filename) {
        return Err(CommandError::storage_invalid_filename(filename));
    }
    // Path traversal check
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return Err(CommandError::storage_path_traversal());
    }
    Ok(())
}

/// Generate a new filename from the current timestamp
pub fn generate_filename() -> String {
    let now = Local::now();
    now.format("%Y-%m-%dT%H%M%S.md").to_string()
}

/// Parse frontmatter from raw note content
fn parse_frontmatter(content: &str) -> (Vec<String>, String) {
    if !content.starts_with("---\n") {
        return (vec![], content.to_string());
    }

    if let Some(end_idx) = content[4..].find("\n---\n") {
        let yaml_str = &content[4..4 + end_idx];
        let body_start = 4 + end_idx + 5; // after `\n---\n`
        // Skip the separator newline (ADR-008)
        let body = if body_start < content.len() && content.as_bytes()[body_start] == b'\n' {
            &content[body_start + 1..]
        } else if body_start <= content.len() {
            &content[body_start..]
        } else {
            ""
        };

        let fm: Frontmatter = serde_yaml::from_str(yaml_str).unwrap_or(Frontmatter { tags: vec![] });
        (fm.tags, body.to_string())
    } else {
        (vec![], content.to_string())
    }
}

/// Generate note content from tags and body (ADR-008 compliant)
fn generate_note_content(tags: &[String], body: &str) -> String {
    let yaml = if tags.is_empty() {
        "tags: []".to_string()
    } else {
        let tag_lines: Vec<String> = tags.iter().map(|t| format!("  - {}", t)).collect();
        format!("tags:\n{}", tag_lines.join("\n"))
    };
    format!("---\n{}\n---\n\n{}", yaml, body)
}

/// Build NoteMetadata from a file
pub fn build_metadata(notes_dir: &Path, filename: &str) -> Result<NoteMetadata, CommandError> {
    let filepath = notes_dir.join(filename);
    let content = fs::read_to_string(&filepath)
        .map_err(|e| CommandError::storage_read_failed(e))?;

    let (tags, body) = parse_frontmatter(&content);

    let meta = fs::metadata(&filepath)
        .map_err(|e| CommandError::storage_read_failed(e))?;

    let created_at = filename_to_datetime(filename);
    let updated_at = meta
        .modified()
        .map(|t| {
            let dt: chrono::DateTime<Local> = t.into();
            dt.to_rfc3339()
        })
        .unwrap_or_else(|_| created_at.clone());

    let body_preview = if body.len() > BODY_PREVIEW_LEN {
        let mut end = BODY_PREVIEW_LEN;
        while end > 0 && !body.is_char_boundary(end) {
            end -= 1;
        }
        body[..end].to_string()
    } else {
        body.clone()
    };

    Ok(NoteMetadata {
        filename: filename.to_string(),
        title: String::new(),
        tags,
        created_at,
        updated_at,
        body_preview,
    })
}

/// Convert filename to ISO datetime string
fn filename_to_datetime(filename: &str) -> String {
    // Parse YYYY-MM-DDTHHMMSS.md
    let stem = filename.trim_end_matches(".md");
    if stem.len() >= 15 {
        let date_part = &stem[..10]; // YYYY-MM-DD
        let time_part = &stem[11..]; // HHMMSS
        if time_part.len() >= 6 {
            return format!(
                "{}T{}:{}:{}",
                date_part,
                &time_part[..2],
                &time_part[2..4],
                &time_part[4..6]
            );
        }
    }
    String::new()
}

/// Create a new note
pub fn create_note(notes_dir: &Path, tags: &[String]) -> Result<NoteMetadata, CommandError> {
    fs::create_dir_all(notes_dir)
        .map_err(|e| CommandError::storage_write_failed(e))?;

    let filename = generate_filename();
    let content = generate_note_content(tags, "");
    let filepath = notes_dir.join(&filename);

    fs::write(&filepath, &content)
        .map_err(|e| CommandError::storage_write_failed(e))?;

    build_metadata(notes_dir, &filename)
}

/// Save (overwrite) a note's content
pub fn save_note(
    notes_dir: &Path,
    filename: &str,
    raw_content: &str,
) -> Result<NoteMetadata, CommandError> {
    validate_filename(filename)?;
    let filepath = notes_dir.join(filename);

    if !filepath.exists() {
        return Err(CommandError::storage_not_found(filename));
    }

    fs::write(&filepath, raw_content)
        .map_err(|e| CommandError::storage_write_failed(e))?;

    build_metadata(notes_dir, filename)
}

/// Read a note's raw content
pub fn read_note(notes_dir: &Path, filename: &str) -> Result<String, CommandError> {
    validate_filename(filename)?;
    let filepath = notes_dir.join(filename);

    if !filepath.exists() {
        return Err(CommandError::storage_not_found(filename));
    }

    fs::read_to_string(&filepath)
        .map_err(|e| CommandError::storage_read_failed(e))
}

/// List notes with optional filters
pub fn list_notes(
    notes_dir: &Path,
    offset: usize,
    limit: usize,
    tags: &Option<Vec<String>>,
    from_date: &Option<String>,
    to_date: &Option<String>,
) -> Result<ListNotesResult, CommandError> {
    let mut all_notes = collect_notes(notes_dir)?;

    // Filter by tags
    if let Some(filter_tags) = tags {
        all_notes.retain(|n| filter_tags.iter().all(|t| n.tags.contains(t)));
    }

    // Filter by date range
    if let Some(from) = from_date {
        all_notes.retain(|n| n.created_at.as_str() >= from.as_str());
    }
    if let Some(to) = to_date {
        let to_end = format!("{}T23:59:59", to);
        all_notes.retain(|n| n.created_at.as_str() <= to_end.as_str());
    }

    // Sort by updated_at descending
    all_notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    let total_count = all_notes.len();
    let notes: Vec<NoteMetadata> = all_notes.into_iter().skip(offset).take(limit).collect();

    Ok(ListNotesResult { notes, total_count })
}

/// Search notes by query string
pub fn search_notes(
    notes_dir: &Path,
    query: &str,
    offset: usize,
    limit: usize,
    tags: &Option<Vec<String>>,
    from_date: &Option<String>,
    to_date: &Option<String>,
) -> Result<SearchNotesResult, CommandError> {
    let all_notes = collect_notes(notes_dir)?;
    let query_lower = query.to_lowercase();

    let mut entries: Vec<SearchResultEntry> = Vec::new();

    for note in all_notes {
        // Filter by tags
        if let Some(filter_tags) = tags {
            if !filter_tags.iter().all(|t| note.tags.contains(t)) {
                continue;
            }
        }

        // Filter by date range
        if let Some(from) = from_date {
            if note.created_at.as_str() < from.as_str() {
                continue;
            }
        }
        if let Some(to) = to_date {
            let to_end = format!("{}T23:59:59", to);
            if note.created_at.as_str() > to_end.as_str() {
                continue;
            }
        }

        // Read full content for search
        let filepath = notes_dir.join(&note.filename);
        let content = match fs::read_to_string(&filepath) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let content_lower = content.to_lowercase();
        if let Some(pos) = content_lower.find(&query_lower) {
            let mut snippet_start = pos.saturating_sub(40);
            while snippet_start > 0 && !content.is_char_boundary(snippet_start) {
                snippet_start -= 1;
            }
            let mut snippet_end = (pos + query.len() + 40).min(content.len());
            while snippet_end < content.len() && !content.is_char_boundary(snippet_end) {
                snippet_end += 1;
            }
            let snippet = content[snippet_start..snippet_end].to_string();

            let highlight = HighlightRange {
                start: pos - snippet_start,
                end: pos - snippet_start + query.len(),
            };

            entries.push(SearchResultEntry {
                metadata: note,
                snippet,
                highlights: vec![highlight],
            });
        }
    }

    // Sort by updated_at descending
    entries.sort_by(|a, b| b.metadata.updated_at.cmp(&a.metadata.updated_at));

    let total_count = entries.len();
    let entries: Vec<SearchResultEntry> = entries.into_iter().skip(offset).take(limit).collect();

    Ok(SearchNotesResult {
        entries,
        total_count,
    })
}

/// List all unique tags across all notes
pub fn list_all_tags(notes_dir: &Path) -> Result<Vec<String>, CommandError> {
    let notes = collect_notes(notes_dir)?;
    let mut tags: Vec<String> = notes
        .into_iter()
        .flat_map(|n| n.tags)
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    tags.sort();
    Ok(tags)
}

/// Trash a note using OS trash
pub fn trash_note(notes_dir: &Path, filename: &str) -> Result<(), CommandError> {
    validate_filename(filename)?;
    let filepath = notes_dir.join(filename);

    if !filepath.exists() {
        return Err(CommandError::storage_not_found(filename));
    }

    trash::delete(&filepath).map_err(|e| CommandError::trash_failed(e))
}

/// Force delete a note (bypass trash)
pub fn force_delete_note(notes_dir: &Path, filename: &str) -> Result<(), CommandError> {
    validate_filename(filename)?;
    let filepath = notes_dir.join(filename);

    if !filepath.exists() {
        return Err(CommandError::storage_not_found(filename));
    }

    fs::remove_file(&filepath).map_err(|e| CommandError::storage_write_failed(e))
}

/// Collect all valid note files from the notes directory
fn collect_notes(notes_dir: &Path) -> Result<Vec<NoteMetadata>, CommandError> {
    if !notes_dir.exists() {
        return Ok(vec![]);
    }

    let re = regex_lite::Regex::new(FILENAME_REGEX).unwrap();
    let mut notes = Vec::new();

    let entries = fs::read_dir(notes_dir)
        .map_err(|e| CommandError::storage_read_failed(e))?;

    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if re.is_match(&name) {
            match build_metadata(notes_dir, &name) {
                Ok(meta) => notes.push(meta),
                Err(_) => continue,
            }
        }
    }

    Ok(notes)
}
