use serde::Serialize;
use std::path::Path;

use super::file_manager;
use super::frontmatter;

#[derive(Debug, Clone, Serialize)]
pub struct HighlightRange {
    pub start: u32,
    pub end: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct SearchMatch {
    pub filename: String,
    pub tags: Vec<String>,
    pub body_preview: String,
    pub snippet: String,
    pub highlights: Vec<HighlightRange>,
}

pub fn full_scan(
    notes_dir: &Path,
    query: &str,
    from_date: Option<&str>,
    to_date: Option<&str>,
    tag_filter: Option<&[String]>,
) -> Result<Vec<SearchMatch>, String> {
    let files = file_manager::list_md_files(notes_dir)?;
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    for filename in &files {
        if !file_manager::filename_in_range(filename, from_date, to_date) {
            continue;
        }
        let path = notes_dir.join(filename);
        let content = match file_manager::read_file(&path) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let parsed = frontmatter::parse(&content);

        if let Some(tags) = tag_filter {
            if !tags.is_empty() && !tags.iter().any(|t| parsed.tags.contains(t)) {
                continue;
            }
        }

        let full_text = content.to_lowercase();
        if let Some(match_pos) = full_text.find(&query_lower) {
            let (snippet, highlights) = build_snippet(&content, match_pos, query.len());
            let preview = truncate(&parsed.body, 200);
            results.push(SearchMatch {
                filename: filename.clone(),
                tags: parsed.tags,
                body_preview: preview,
                snippet,
                highlights,
            });
        }
    }
    Ok(results)
}

fn build_snippet(content: &str, match_pos: usize, match_len: usize) -> (String, Vec<HighlightRange>) {
    let start = match_pos.saturating_sub(50);
    let end = (match_pos + match_len + 50).min(content.len());

    // Adjust to char boundaries
    let start = content[..start]
        .rfind(|c: char| c.is_whitespace())
        .map(|p| p + 1)
        .unwrap_or(start);
    let end = content[end..]
        .find(|c: char| c.is_whitespace())
        .map(|p| end + p)
        .unwrap_or(end);

    let snippet = &content[start..end];
    let hl_start = (match_pos - start) as u32;
    let hl_end = hl_start + match_len as u32;

    (
        snippet.to_string(),
        vec![HighlightRange {
            start: hl_start,
            end: hl_end,
        }],
    )
}

fn truncate(text: &str, max: usize) -> String {
    let trimmed = text.trim();
    if trimmed.chars().count() <= max {
        trimmed.to_string()
    } else {
        trimmed.chars().take(max).collect::<String>() + "…"
    }
}
