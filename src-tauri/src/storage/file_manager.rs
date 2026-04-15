use chrono::Local;
use regex::Regex;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;
use std::thread;
use std::time::Duration;

static FILENAME_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^\d{4}-\d{2}-\d{2}T\d{6}\.md$").unwrap());

pub fn is_valid_filename(name: &str) -> bool {
    FILENAME_RE.is_match(name)
}

pub fn generate_filename(notes_dir: &Path) -> Result<String, String> {
    for _ in 0..5 {
        let name = Local::now().format("%Y-%m-%dT%H%M%S.md").to_string();
        if !notes_dir.join(&name).exists() {
            return Ok(name);
        }
        thread::sleep(Duration::from_secs(1));
    }
    Err("Failed to generate unique filename".into())
}

pub fn validate_path(filename: &str, notes_dir: &Path) -> Result<PathBuf, String> {
    if !is_valid_filename(filename) {
        return Err(format!("Invalid filename: {}", filename));
    }
    if filename.contains('/') || filename.contains('\\') {
        return Err("Path traversal detected".into());
    }
    let full = notes_dir.join(filename);
    if let Ok(canon_dir) = notes_dir.canonicalize() {
        if full.exists() {
            if let Ok(canon_file) = full.canonicalize() {
                if !canon_file.starts_with(&canon_dir) {
                    return Err("Path traversal detected".into());
                }
            }
        }
    }
    Ok(full)
}

pub fn write_file(path: &Path, content: &str) -> Result<(), String> {
    let dir = path.parent().ok_or("No parent directory")?;
    let tmp = dir.join(format!(".{}.tmp", path.file_name().unwrap().to_string_lossy()));
    std::fs::write(&tmp, content).map_err(|e| format!("Write failed: {}", e))?;
    std::fs::rename(&tmp, path).map_err(|e| {
        std::fs::remove_file(&tmp).ok();
        format!("Rename failed: {}", e)
    })
}

pub fn read_file(path: &Path) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| format!("Read failed: {}", e))
}

pub fn list_md_files(notes_dir: &Path) -> Result<Vec<String>, String> {
    let mut names: Vec<String> = std::fs::read_dir(notes_dir)
        .map_err(|e| format!("Cannot read directory: {}", e))?
        .filter_map(|e| e.ok())
        .filter_map(|e| e.file_name().into_string().ok())
        .filter(|n| is_valid_filename(n))
        .collect();
    names.sort_by(|a, b| b.cmp(a));
    Ok(names)
}

pub fn filename_to_created_at(filename: &str) -> String {
    let stem = filename.trim_end_matches(".md");
    if stem.len() == 17 {
        let date = &stem[..10];
        let hh = &stem[11..13];
        let mm = &stem[13..15];
        let ss = &stem[15..17];
        format!("{}T{}:{}:{}", date, hh, mm, ss)
    } else {
        stem.to_string()
    }
}

pub fn filename_in_range(filename: &str, from: Option<&str>, to: Option<&str>) -> bool {
    let stem = filename.trim_end_matches(".md");
    if let Some(f) = from {
        if stem < f {
            return false;
        }
    }
    if let Some(t) = to {
        if stem > t {
            return false;
        }
    }
    true
}
