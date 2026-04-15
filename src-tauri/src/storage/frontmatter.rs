use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NoteFrontmatter {
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, serde_yaml::Value>,
}

pub struct ParseResult {
    pub tags: Vec<String>,
    pub body: String,
}

pub fn parse(content: &str) -> ParseResult {
    if !content.starts_with("---\n") {
        return ParseResult {
            tags: vec![],
            body: content.to_string(),
        };
    }
    let rest = &content[4..];
    if let Some(pos) = rest.find("\n---\n") {
        let yaml = &rest[..pos];
        let body_start = 4 + pos + 5;
        let body = if body_start < content.len() {
            content[body_start..].to_string()
        } else {
            String::new()
        };
        let fm: NoteFrontmatter = serde_yaml::from_str(yaml).unwrap_or_default();
        ParseResult {
            tags: fm.tags,
            body,
        }
    } else {
        ParseResult {
            tags: vec![],
            body: content.to_string(),
        }
    }
}

pub fn serialize_empty() -> &'static str {
    "---\ntags: []\n---\n"
}

pub fn reassemble(tags: &[String], body: &str) -> String {
    let fm = if tags.is_empty() {
        "---\ntags: []\n---\n".to_string()
    } else {
        format!("---\ntags: [{}]\n---\n", tags.join(", "))
    };
    format!("{}\n{}", fm, body)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn check_round_trip(body: &str) {
        let initial = format!("---\ntags: []\n---\n\n{}", body);

        // 1st parse: body must equal the original body (no leading separator newline)
        let parsed = parse(&initial);
        assert_eq!(
            parsed.body, body,
            "ADR-008: body must not include separator newline after closing fence (1st parse)"
        );
        assert_eq!(parsed.tags, Vec::<String>::new());

        // reassemble must reconstruct the exact initial content
        let reassembled = reassemble(&parsed.tags, &parsed.body);
        assert_eq!(
            reassembled, initial,
            "ADR-008: reassemble(parse(x)) must equal x (file layout `---\\n<yaml>\\n---\\n\\n<body>` preserved)"
        );

        // 2nd round: parse → reassemble must be stable (idempotent)
        let parsed2 = parse(&reassembled);
        assert_eq!(
            parsed2.body, body,
            "ADR-008: 2nd parse body must equal original body (idempotency)"
        );
        let reassembled2 = reassemble(&parsed2.tags, &parsed2.body);
        assert_eq!(
            reassembled2, reassembled,
            "ADR-008: 2nd reassemble must equal 1st reassemble (idempotency)"
        );
    }

    #[test]
    fn round_trip_simple_body() {
        check_round_trip("Hello");
    }

    #[test]
    fn round_trip_empty_body() {
        check_round_trip("");
    }

    #[test]
    fn round_trip_multiline_japanese_body() {
        check_round_trip("こんにちは\n\n世界  \n末尾");
    }
}
