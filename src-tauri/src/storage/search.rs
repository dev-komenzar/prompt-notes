use crate::storage::file_manager::{filename_to_datetime, FileManager};
use crate::storage::frontmatter;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteMetadata {
    pub filename: String,
    pub title: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub body_preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HighlightRange {
    pub start: u32,
    pub end: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultEntry {
    pub metadata: NoteMetadata,
    pub snippet: String,
    pub highlights: Vec<HighlightRange>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchNotesResult {
    pub entries: Vec<SearchResultEntry>,
    pub total_count: usize,
}

pub struct SearchOptions {
    pub query: String,
    pub from_date: Option<String>,
    pub to_date: Option<String>,
    pub tags: Option<Vec<String>>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

fn safe_boundary_left(s: &str, mut pos: usize) -> usize {
    while pos > 0 && !s.is_char_boundary(pos) {
        pos -= 1;
    }
    pos
}

fn safe_boundary_right(s: &str, mut pos: usize) -> usize {
    let len = s.len();
    pos = pos.min(len);
    while pos < len && !s.is_char_boundary(pos) {
        pos += 1;
    }
    pos
}

fn build_snippet(body: &str, query_lower: &str) -> Option<(String, Vec<HighlightRange>)> {
    let body_lower = body.to_lowercase();
    let match_start = body_lower.find(query_lower)?;
    let match_end = match_start + query_lower.len();

    let context = 50;
    let raw_snip_start = if match_start > context { match_start - context } else { 0 };
    let raw_snip_end = (match_end + context).min(body.len());

    let snip_start = safe_boundary_left(body, raw_snip_start);
    let snip_end = safe_boundary_right(body, raw_snip_end);

    let snippet = body[snip_start..snip_end].to_string();

    let hl_start = (match_start - snip_start) as u32;
    let hl_end = (match_end - snip_start) as u32;

    Some((snippet, vec![HighlightRange { start: hl_start, end: hl_end }]))
}

pub fn full_scan(notes_dir: &Path, opts: &SearchOptions) -> Result<SearchNotesResult, String> {
    let fm = FileManager::new(notes_dir.to_str().unwrap_or(""));
    let files = fm.list_files().map_err(|e| e.to_string())?;
    let query_lower = opts.query.to_lowercase();

    let mut entries: Vec<SearchResultEntry> = Vec::new();

    for filename in &files {
        let created_at = match filename_to_datetime(filename) {
            Some(dt) => dt,
            None => continue,
        };

        // Date range filter
        if let Some(ref from) = opts.from_date {
            if created_at < *from {
                continue;
            }
        }
        if let Some(ref to) = opts.to_date {
            if created_at > *to {
                continue;
            }
        }

        let content = match fm.read(filename) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let parsed = frontmatter::parse(&content);
        let body = frontmatter::extract_body(&content);

        // Tags filter (OR): at least one of opts.tags must be in note's tags
        if let Some(ref filter_tags) = opts.tags {
            if !filter_tags.iter().any(|t| parsed.tags.contains(t)) {
                continue;
            }
        }

        // Body-only query match
        if !body.to_lowercase().contains(&query_lower) {
            continue;
        }

        let (snippet, highlights) = match build_snippet(&body, &query_lower) {
            Some(s) => s,
            None => continue,
        };

        let body_preview: String = body.chars().take(100).collect();

        entries.push(SearchResultEntry {
            metadata: NoteMetadata {
                filename: filename.clone(),
                title: String::new(),
                tags: parsed.tags,
                created_at: created_at.clone(),
                updated_at: created_at,
                body_preview,
            },
            snippet,
            highlights,
        });
    }

    // Sort by created_at descending
    entries.sort_by(|a, b| b.metadata.created_at.cmp(&a.metadata.created_at));

    let total_count = entries.len();
    let offset = opts.offset.unwrap_or(0) as usize;
    let limit = opts.limit.unwrap_or(100) as usize;
    let paginated: Vec<SearchResultEntry> = entries.into_iter().skip(offset).take(limit).collect();

    Ok(SearchNotesResult { entries: paginated, total_count })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn make_note(dir: &TempDir, filename: &str, tags: &[&str], body: &str) {
        let tag_yaml = if tags.is_empty() {
            "tags: []".to_string()
        } else {
            let lines: Vec<String> = tags.iter().map(|t| format!("  - {}", t)).collect();
            format!("tags:\n{}", lines.join("\n"))
        };
        let content = format!("---\n{}\n---\n\n{}", tag_yaml, body);
        fs::write(dir.path().join(filename), content).unwrap();
    }

    fn opts(query: &str) -> SearchOptions {
        SearchOptions {
            query: query.to_string(),
            from_date: None,
            to_date: None,
            tags: None,
            limit: None,
            offset: None,
        }
    }

    #[test]
    fn test_simple_ascii_match() {
        let dir = TempDir::new().unwrap();
        make_note(&dir, "2025-01-01T120000.md", &[], "hello world foo bar");
        let result = full_scan(dir.path(), &opts("hello")).unwrap();
        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.total_count, 1);
        let entry = &result.entries[0];
        assert!(entry.snippet.contains("hello"));
        assert_eq!(entry.highlights.len(), 1);
        let hl = &entry.highlights[0];
        assert_eq!(&entry.snippet[hl.start as usize..hl.end as usize], "hello");
    }

    #[test]
    fn test_japanese_utf8_boundary() {
        let dir = TempDir::new().unwrap();
        make_note(&dir, "2025-01-02T120000.md", &[], "これはテスト用の日本語テキストです。検索クエリを含みます。");
        let result = full_scan(dir.path(), &opts("検索")).unwrap();
        assert_eq!(result.entries.len(), 1);
        let entry = &result.entries[0];
        // Snippet must be valid UTF-8 with correct char boundaries
        assert!(entry.snippet.is_char_boundary(0));
        assert!(entry.snippet.is_char_boundary(entry.snippet.len()));
        let hl = &entry.highlights[0];
        // The highlighted slice must be valid UTF-8
        let hl_text = &entry.snippet[hl.start as usize..hl.end as usize];
        assert_eq!(hl_text, "検索");
    }

    #[test]
    fn test_no_match_returns_empty() {
        let dir = TempDir::new().unwrap();
        make_note(&dir, "2025-01-03T120000.md", &[], "completely different content");
        let result = full_scan(dir.path(), &opts("zzznomatch")).unwrap();
        assert_eq!(result.entries.len(), 0);
        assert_eq!(result.total_count, 0);
    }

    #[test]
    fn test_tag_only_not_matched_by_body_search() {
        // tags contain the query but body does not → should NOT match (body-only search)
        let dir = TempDir::new().unwrap();
        make_note(&dir, "2025-01-04T120000.md", &["rust"], "no mention of the keyword here");
        let result = full_scan(dir.path(), &opts("rust")).unwrap();
        assert_eq!(result.entries.len(), 0);
    }

    #[test]
    fn test_total_count_before_pagination() {
        let dir = TempDir::new().unwrap();
        make_note(&dir, "2025-01-05T120000.md", &[], "needle in haystack one");
        make_note(&dir, "2025-01-06T120000.md", &[], "needle in haystack two");
        make_note(&dir, "2025-01-07T120000.md", &[], "needle in haystack three");
        let mut o = opts("needle");
        o.limit = Some(1);
        o.offset = Some(0);
        let result = full_scan(dir.path(), &o).unwrap();
        assert_eq!(result.total_count, 3);
        assert_eq!(result.entries.len(), 1);
    }

    #[test]
    fn test_offset_limit_slicing() {
        let dir = TempDir::new().unwrap();
        make_note(&dir, "2025-01-08T120000.md", &[], "match alpha");
        make_note(&dir, "2025-01-09T120000.md", &[], "match beta");
        make_note(&dir, "2025-01-10T120000.md", &[], "match gamma");
        let mut o = opts("match");
        o.limit = Some(2);
        o.offset = Some(1);
        let result = full_scan(dir.path(), &o).unwrap();
        assert_eq!(result.total_count, 3);
        assert_eq!(result.entries.len(), 2);
    }
}
