// NOTE: このファイルは Rust ソースです。アセンブル時に src-tauri/src/search.rs へ配置してください。
// @generated-from: docs/detailed_design/grid_search_design.md §4.6
// @generated-from: docs/detailed_design/storage_fileformat_design.md §3.3
//
// search モジュール: Rust Core Process 内でファイル全走査による全文検索を実行する。
// フロントエンドから invoke('search_notes') で呼び出す。
// インデックス構築は行わない (ADR-005: 想定数十件/週のデータ量で十分)。

/*
use tauri::State;

use crate::config::ConfigState;
use crate::error::StorageError;
use crate::models::{NoteFilter, NoteMetadata};
use crate::storage::{list_note_files, parse_filename, parse_frontmatter, resolve_notes_dir};

/// 全文検索コマンド。ファイル全走査でケースインセンシティブ部分一致を実行する。
///
/// - query が空文字列の場合は filter のみを適用して list_notes と同等に動作する。
/// - 日付フィルタはファイル読み込み前にファイル名ベースで適用し I/O を最小化する。
/// - タグフィルタは AND 条件 (選択した全タグを含むノートのみ)。
/// - 結果は created_at 降順 (新しい順) で返却する。
#[tauri::command]
pub async fn search_notes(
    query: String,
    filter: Option<NoteFilter>,
    config_state: State<'_, ConfigState>,
) -> Result<Vec<NoteMetadata>, StorageError> {
    let notes_dir = resolve_notes_dir(&config_state)?;
    let files = list_note_files(&notes_dir)?;
    let mut results: Vec<NoteMetadata> = Vec::new();

    for file_path in files {
        let filename = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| StorageError::InvalidFilename(String::new()))?
            .to_string();

        let (id, created_at) = match parse_filename(&filename) {
            Ok(v) => v,
            Err(_) => continue, // 不正なファイル名はスキップ
        };

        // 日付フィルタ: ファイル読み込み前にスキップし I/O を節約
        if let Some(ref f) = filter {
            if let Some(ref from) = f.date_from {
                if created_at.get(..10).unwrap_or("") < from.as_str() {
                    continue;
                }
            }
            if let Some(ref to) = f.date_to {
                if created_at.get(..10).unwrap_or("") > to.as_str() {
                    continue;
                }
            }
        }

        let content = match std::fs::read_to_string(&file_path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let (frontmatter, body) = match parse_frontmatter(&content) {
            Ok(v) => v,
            Err(_) => continue,
        };

        // タグフィルタ (AND 条件)
        if let Some(ref f) = filter {
            if let Some(ref filter_tags) = f.tags {
                if !filter_tags.is_empty() {
                    let all_match = filter_tags
                        .iter()
                        .all(|ft| frontmatter.tags.contains(ft));
                    if !all_match {
                        continue;
                    }
                }
            }
        }

        // 全文検索: ケースインセンシティブ部分一致 (本文 + タグ文字列を対象)
        // query が空の場合はマッチ条件をスキップ (filter のみ適用)
        let query_lower = query.to_lowercase();
        if !query_lower.is_empty() {
            let body_lower = body.to_lowercase();
            let tags_str = frontmatter.tags.join(" ").to_lowercase();
            if !body_lower.contains(&query_lower) && !tags_str.contains(&query_lower) {
                continue;
            }
        }

        // プレビュー: 本文先頭 100 文字 (マルチバイト文字安全)
        let preview: String = body.chars().take(100).collect();

        results.push(NoteMetadata {
            id,
            tags: frontmatter.tags,
            created_at,
            preview,
        });
    }

    // created_at 降順 (新しい順)
    results.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(results)
}
*/
