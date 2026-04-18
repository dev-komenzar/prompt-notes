use crate::commands::notes::{NoteMetadata, SearchResultEntry};
use crate::storage::file_manager::FileManager;
use crate::storage::frontmatter;
use std::io;

pub fn full_scan(
    fm: &FileManager,
    query: &str,
) -> io::Result<Vec<SearchResultEntry>> {
    let files = fm.list_files()?;
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();

    for filename in &files {
        let content = match fm.read(filename) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let body = frontmatter::extract_body(&content);
        let parsed = frontmatter::parse(&content);

        // Search in body lines
        for (idx, line) in body.lines().enumerate() {
            if line.to_lowercase().contains(&query_lower) {
                let preview: String = body.chars().take(100).collect();
                let created_at =
                    crate::storage::file_manager::filename_to_datetime(filename)
                        .unwrap_or_default();

                results.push(SearchResultEntry {
                    metadata: NoteMetadata {
                        filename: filename.clone(),
                        title: String::new(),
                        tags: parsed.tags.clone(),
                        created_at: created_at.clone(),
                        updated_at: created_at,
                        body_preview: preview,
                    },
                    matched_line: line.to_string(),
                    line_number: idx + 1,
                });
                break; // One match per file
            }
        }

        // Also search in tags
        if results.last().map_or(true, |r| r.metadata.filename != *filename) {
            for tag in &parsed.tags {
                if tag.to_lowercase().contains(&query_lower) {
                    let preview: String = body.chars().take(100).collect();
                    let created_at =
                        crate::storage::file_manager::filename_to_datetime(filename)
                            .unwrap_or_default();

                    results.push(SearchResultEntry {
                        metadata: NoteMetadata {
                            filename: filename.clone(),
                            title: String::new(),
                            tags: parsed.tags.clone(),
                            created_at: created_at.clone(),
                            updated_at: created_at,
                            body_preview: preview,
                        },
                        matched_line: format!("[tag: {}]", tag),
                        line_number: 0,
                    });
                    break;
                }
            }
        }
    }

    Ok(results)
}
