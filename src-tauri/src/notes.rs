use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteEntry {
    pub filename: String,
    pub tags: Vec<String>,
    pub body_preview: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNoteResult {
    pub filename: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadNoteResult {
    pub raw: String,
    pub tags: Vec<String>,
    pub body: String,
}

#[derive(Debug, Deserialize)]
struct Frontmatter {
    #[serde(default)]
    tags: Vec<String>,
}

/// Generate a filename from the current timestamp: YYYY-MM-DDTHHMMSS.md
pub fn generate_filename() -> String {
    let now = chrono::Local::now();
    now.format("%Y-%m-%dT%H%M%S.md").to_string()
}

/// Build full raw content with YAML frontmatter.
pub fn build_raw(body: &str, tags: &[String]) -> String {
    let tags_yaml = if tags.is_empty() {
        "tags: []".to_string()
    } else {
        let items: Vec<String> = tags.iter().map(|t| format!("  - {}", t)).collect();
        format!("tags:\n{}", items.join("\n"))
    };
    format!("---\n{}\n---\n{}", tags_yaml, body)
}

/// Parse raw content into (tags, body).
pub fn parse_raw(raw: &str) -> (Vec<String>, String) {
    if !raw.starts_with("---\n") {
        return (vec![], raw.to_string());
    }

    let rest = &raw[4..]; // skip "---\n"
    if let Some(end_idx) = rest.find("\n---\n") {
        let yaml_block = &rest[..end_idx];
        let body = &rest[end_idx + 5..]; // skip "\n---\n"

        let tags = parse_tags_from_yaml(yaml_block);
        (tags, body.to_string())
    } else if let Some(end_idx) = rest.find("\n---") {
        // Handle case where --- is at end of file with no trailing newline
        let yaml_block = &rest[..end_idx];
        let body_start = end_idx + 4; // skip "\n---"
        let body = if body_start < rest.len() {
            &rest[body_start..]
        } else {
            ""
        };
        let tags = parse_tags_from_yaml(yaml_block);
        (tags, body.to_string())
    } else {
        (vec![], raw.to_string())
    }
}

fn parse_tags_from_yaml(yaml_block: &str) -> Vec<String> {
    // Try serde_yaml first
    if let Ok(fm) = serde_yaml::from_str::<Frontmatter>(yaml_block) {
        return fm.tags;
    }
    vec![]
}

/// Create a body preview (first N chars).
pub fn body_preview(body: &str, max_len: usize) -> String {
    let trimmed = body.trim();
    if trimmed.chars().count() <= max_len {
        trimmed.to_string()
    } else {
        let end = trimmed
            .char_indices()
            .nth(max_len)
            .map(|(i, _)| i)
            .unwrap_or(trimmed.len());
        format!("{}…", &trimmed[..end])
    }
}

/// List notes in the given directory with optional filters.
pub fn list_notes_in_dir(
    dir: &Path,
    date_from: Option<&str>,
    date_to: Option<&str>,
    tags: Option<&[String]>,
) -> Result<Vec<NoteEntry>, String> {
    ensure_dir(dir)?;

    let mut entries: Vec<NoteEntry> = Vec::new();

    let read_dir = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    let from_date = date_from.and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
    let to_date = date_to.and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().to_string_lossy().to_string();

        if !file_name.ends_with(".md") {
            continue;
        }

        // Date filter from filename
        if let Some(file_date) = parse_date_from_filename(&file_name) {
            if let Some(ref from) = from_date {
                if file_date < *from {
                    continue;
                }
            }
            if let Some(ref to) = to_date {
                if file_date > *to {
                    continue;
                }
            }
        }

        let path = entry.path();
        let raw = fs::read_to_string(&path).unwrap_or_default();
        let (note_tags, body) = parse_raw(&raw);

        // Tag filter
        if let Some(filter_tags) = tags {
            if !filter_tags.is_empty() {
                let has_match = filter_tags.iter().any(|t| note_tags.contains(t));
                if !has_match {
                    continue;
                }
            }
        }

        entries.push(NoteEntry {
            filename: file_name.clone(),
            tags: note_tags,
            body_preview: body_preview(&body, 200),
            created_at: file_name.clone(),
        });
    }

    // Sort by filename descending (newest first)
    entries.sort_by(|a, b| b.filename.cmp(&a.filename));

    Ok(entries)
}

/// Search notes by query string (case-insensitive full-text search).
pub fn search_notes_in_dir(
    dir: &Path,
    query: &str,
    date_from: Option<&str>,
    date_to: Option<&str>,
    tags: Option<&[String]>,
) -> Result<Vec<NoteEntry>, String> {
    let all = list_notes_in_dir(dir, date_from, date_to, tags)?;
    let query_lower = query.to_lowercase();

    Ok(all
        .into_iter()
        .filter(|note| {
            let path = dir.join(&note.filename);
            let raw = fs::read_to_string(&path).unwrap_or_default();
            raw.to_lowercase().contains(&query_lower)
        })
        .collect())
}

fn parse_date_from_filename(filename: &str) -> Option<NaiveDate> {
    // YYYY-MM-DDTHHMMSS.md -> extract YYYY-MM-DD
    if filename.len() >= 10 {
        NaiveDate::parse_from_str(&filename[..10], "%Y-%m-%d").ok()
    } else {
        None
    }
}

pub fn ensure_dir(dir: &Path) -> Result<(), String> {
    if !dir.exists() {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn body_preview_short_ascii() {
        assert_eq!(body_preview("hello", 10), "hello");
    }

    #[test]
    fn body_preview_exact_length() {
        assert_eq!(body_preview("12345", 5), "12345");
    }

    #[test]
    fn body_preview_truncates_ascii() {
        assert_eq!(body_preview("hello world", 5), "hello…");
    }

    #[test]
    fn body_preview_japanese_no_truncation() {
        assert_eq!(body_preview("こんにちは", 5), "こんにちは");
    }

    #[test]
    fn body_preview_japanese_truncation() {
        let result = body_preview("こんにちは世界", 5);
        assert_eq!(result, "こんにちは…");
    }

    #[test]
    fn body_preview_mixed_multibyte() {
        let result = body_preview("aあbいcうdえe", 5);
        assert_eq!(result, "aあbいc…");
    }

    #[test]
    fn body_preview_trims_whitespace() {
        assert_eq!(body_preview("  hello  ", 10), "hello");
    }

    #[test]
    fn body_preview_empty_string() {
        assert_eq!(body_preview("", 10), "");
    }

    #[test]
    fn body_preview_zero_max_len() {
        assert_eq!(body_preview("hello", 0), "…");
    }
}
