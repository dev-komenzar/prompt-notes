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
