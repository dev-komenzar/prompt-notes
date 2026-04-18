use chrono::Local;
use regex::Regex;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

pub struct FileManager {
    base_dir: PathBuf,
}

static FILENAME_RE: &str = r"^\d{4}-\d{2}-\d{2}T\d{6}\.md$";

impl FileManager {
    pub fn new(base_dir: &str) -> Self {
        Self {
            base_dir: PathBuf::from(base_dir),
        }
    }

    pub fn ensure_directory(&self) -> io::Result<()> {
        fs::create_dir_all(&self.base_dir)
    }

    pub fn generate_filename(&self) -> String {
        let now = Local::now();
        let name = now.format("%Y-%m-%dT%H%M%S").to_string();
        format!("{}.md", name)
    }

    pub fn validate_filename(filename: &str) -> bool {
        let re = Regex::new(FILENAME_RE).unwrap();
        re.is_match(filename)
    }

    pub fn file_path(&self, filename: &str) -> PathBuf {
        self.base_dir.join(filename)
    }

    /// Atomic write: write to temp file then rename.
    pub fn write(&self, filename: &str, content: &str) -> io::Result<()> {
        self.ensure_directory()?;

        if !Self::validate_filename(filename) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                format!("Invalid filename: {}", filename),
            ));
        }

        let target = self.file_path(filename);
        let temp_name = format!(".{}.tmp", filename);
        let temp_path = self.base_dir.join(&temp_name);

        fs::write(&temp_path, content)?;
        fs::rename(&temp_path, &target)?;

        Ok(())
    }

    pub fn read(&self, filename: &str) -> io::Result<String> {
        if !Self::validate_filename(filename) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                format!("Invalid filename: {}", filename),
            ));
        }
        let path = self.file_path(filename);
        fs::read_to_string(&path)
    }

    pub fn delete(&self, filename: &str) -> io::Result<()> {
        if !Self::validate_filename(filename) {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                format!("Invalid filename: {}", filename),
            ));
        }
        let path = self.file_path(filename);
        fs::remove_file(&path)
    }

    pub fn list_files(&self) -> io::Result<Vec<String>> {
        let mut files = Vec::new();

        if !self.base_dir.exists() {
            return Ok(files);
        }

        let re = Regex::new(FILENAME_RE).unwrap();

        for entry in fs::read_dir(&self.base_dir)? {
            let entry = entry?;
            if let Some(name) = entry.file_name().to_str() {
                if re.is_match(name) && entry.file_type()?.is_file() {
                    files.push(name.to_string());
                }
            }
        }

        // Sort descending (newest first)
        files.sort_by(|a, b| b.cmp(a));

        Ok(files)
    }
}

pub fn filename_to_datetime(filename: &str) -> Option<String> {
    // Parse YYYY-MM-DDTHHMMSS.md → YYYY-MM-DDTHH:MM:SS
    let re = Regex::new(r"^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})\.md$").unwrap();
    re.captures(filename).map(|caps| {
        format!(
            "{}T{}:{}:{}",
            &caps[1], &caps[2], &caps[3], &caps[4]
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_filename() {
        assert!(FileManager::validate_filename("2025-01-15T143022.md"));
        assert!(!FileManager::validate_filename("bad-name.md"));
        assert!(!FileManager::validate_filename("2025-01-15T143022.txt"));
    }

    #[test]
    fn test_filename_to_datetime() {
        assert_eq!(
            filename_to_datetime("2025-01-15T143022.md"),
            Some("2025-01-15T14:30:22".to_string())
        );
        assert_eq!(filename_to_datetime("bad.md"), None);
    }
}
