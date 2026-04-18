use serde::{Deserialize, Serialize};

/// ADR-008 compliant frontmatter parsing.
///
/// Layout: `---\n<yaml>\n---\n\n<body>`
/// Round-trip invariant: reassemble(parse_raw(raw)) == raw

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedFrontmatter {
    pub tags: Vec<String>,
}

/// Parse the YAML frontmatter from raw note content.
pub fn parse(raw: &str) -> ParsedFrontmatter {
    if !raw.starts_with("---\n") {
        return ParsedFrontmatter { tags: vec![] };
    }

    let rest = &raw[4..];
    let close_idx = match rest.find("\n---\n") {
        Some(idx) => idx,
        None => return ParsedFrontmatter { tags: vec![] },
    };

    let yaml_str = &rest[..close_idx];

    // Parse tags from YAML
    let tags = parse_tags_from_yaml(yaml_str);

    ParsedFrontmatter { tags }
}

fn parse_tags_from_yaml(yaml: &str) -> Vec<String> {
    let mut tags = Vec::new();
    let mut in_tags = false;

    for line in yaml.lines() {
        if line.starts_with("tags:") {
            in_tags = true;
            // Check inline: tags: [a, b]
            if let Some(start) = line.find('[') {
                if let Some(end) = line.find(']') {
                    let inner = &line[start + 1..end];
                    return inner
                        .split(',')
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                        .collect();
                }
            }
            // Check inline empty: tags: []
            if line.trim() == "tags: []" {
                return vec![];
            }
            continue;
        }
        if in_tags {
            let trimmed = line.trim();
            if trimmed.starts_with("- ") {
                tags.push(trimmed[2..].trim().to_string());
            } else {
                break;
            }
        }
    }

    tags
}

/// Extract body from raw note content (everything after frontmatter + separator).
pub fn extract_body(raw: &str) -> String {
    if !raw.starts_with("---\n") {
        return raw.to_string();
    }

    let rest = &raw[4..];
    let close_idx = match rest.find("\n---\n") {
        Some(idx) => idx,
        None => return raw.to_string(),
    };

    let after_fence = &rest[close_idx + 5..]; // skip \n---\n
    // Skip the separator \n between closing fence and body
    if after_fence.starts_with('\n') {
        after_fence[1..].to_string()
    } else {
        after_fence.to_string()
    }
}

/// Generate ADR-008 compliant note content from tags and body.
pub fn generate(tags: &[String], body: &str) -> String {
    let yaml = if tags.is_empty() {
        "tags: []".to_string()
    } else {
        let tag_lines: Vec<String> = tags.iter().map(|t| format!("  - {}", t)).collect();
        format!("tags:\n{}", tag_lines.join("\n"))
    };

    format!("---\n{}\n---\n\n{}", yaml, body)
}

/// Reassemble raw content from frontmatter and body.
/// Preserves round-trip idempotency.
pub fn reassemble(raw_frontmatter: &str, body: &str) -> String {
    format!("{}\n{}", raw_frontmatter, body)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_round_trip_empty_tags() {
        let raw = "---\ntags: []\n---\n\nHello world";
        let parsed = parse(raw);
        assert!(parsed.tags.is_empty());
        let body = extract_body(raw);
        assert_eq!(body, "Hello world");

        let regenerated = generate(&parsed.tags, &body);
        assert_eq!(regenerated, raw);
    }

    #[test]
    fn test_round_trip_with_tags() {
        let raw = "---\ntags:\n  - rust\n  - tauri\n---\n\nSome content here";
        let parsed = parse(raw);
        assert_eq!(parsed.tags, vec!["rust", "tauri"]);
        let body = extract_body(raw);
        assert_eq!(body, "Some content here");

        let regenerated = generate(&parsed.tags, &body);
        assert_eq!(regenerated, raw);
    }

    #[test]
    fn test_empty_body() {
        let raw = "---\ntags: []\n---\n\n";
        let parsed = parse(raw);
        assert!(parsed.tags.is_empty());
        let body = extract_body(raw);
        assert_eq!(body, "");
    }

    #[test]
    fn test_no_frontmatter() {
        let raw = "Just plain text";
        let parsed = parse(raw);
        assert!(parsed.tags.is_empty());
        let body = extract_body(raw);
        assert_eq!(body, "Just plain text");
    }

    #[test]
    fn test_idempotent_n_iterations() {
        let original = "---\ntags:\n  - test\n---\n\nBody text";
        let mut current = original.to_string();
        for _ in 0..10 {
            let parsed = parse(&current);
            let body = extract_body(&current);
            current = generate(&parsed.tags, &body);
        }
        assert_eq!(current, original);
    }
}
