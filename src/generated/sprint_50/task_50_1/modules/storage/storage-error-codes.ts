// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=50, task=50-1, module=storage, resolves=OQ-006
// Storage error code constants matching the Rust backend error variants.
// This file documents the contract between Rust module:storage and TypeScript frontend.
//
// The Rust backend returns errors as strings via Tauri IPC's error mechanism.
// The ipc-error-extractor.ts module pattern-matches these strings to StorageErrorCode.
//
// When adding new error types in Rust, update both:
//   1. This file (documentation + optional structured codes)
//   2. ipc-error-extractor.ts (pattern matching rules)

import { StorageErrorCode } from '../../types/errors';

/**
 * Maps StorageErrorCode to the expected Rust error message substrings.
 * This serves as documentation of the IPC error contract and can be used
 * in integration tests to verify error classification.
 */
export const RUST_ERROR_MESSAGE_CONTRACTS: ReadonlyMap<
  StorageErrorCode,
  ReadonlyArray<string>
> = new Map([
  [
    StorageErrorCode.FILE_NOT_FOUND,
    ['not found', 'No such file or directory'],
  ],
  [
    StorageErrorCode.DIRECTORY_NOT_FOUND,
    ['directory not found', 'directory does not exist', 'notes directory not found'],
  ],
  [
    StorageErrorCode.PERMISSION_DENIED,
    ['Permission denied', 'Access denied'],
  ],
  [
    StorageErrorCode.WRITE_FAILED,
    ['write failed', 'disk full', 'No space left on device'],
  ],
  [
    StorageErrorCode.READ_FAILED,
    ['read failed'],
  ],
  [
    StorageErrorCode.INVALID_FILENAME,
    ['invalid filename', 'path traversal'],
  ],
  [
    StorageErrorCode.FRONTMATTER_PARSE_ERROR,
    ['frontmatter parse error', 'yaml parse error'],
  ],
  [
    StorageErrorCode.CONFIG_IO_ERROR,
    ['config read error', 'config write error', 'config save error'],
  ],
  [
    StorageErrorCode.INVALID_DIRECTORY,
    ['invalid directory', 'invalid path'],
  ],
  [
    StorageErrorCode.DIRECTORY_NOT_WRITABLE,
    ['not writable', 'cannot write to directory'],
  ],
]);

/**
 * Returns the user-facing Japanese message for a given error code.
 * Can be used in Rust → structured error response integration (future enhancement).
 */
export const ERROR_USER_MESSAGES: ReadonlyMap<StorageErrorCode, string> = new Map([
  [StorageErrorCode.FILE_NOT_FOUND, 'ファイルが見つかりません。'],
  [StorageErrorCode.DIRECTORY_NOT_FOUND, 'ノート保存ディレクトリが見つかりません。設定画面でディレクトリを確認してください。'],
  [StorageErrorCode.PERMISSION_DENIED, 'ファイルへのアクセスが拒否されました。ディレクトリの権限を確認してください。'],
  [StorageErrorCode.WRITE_FAILED, 'ファイルの保存に失敗しました。ディスク容量を確認してください。'],
  [StorageErrorCode.READ_FAILED, 'ファイルの読み込みに失敗しました。'],
  [StorageErrorCode.INVALID_FILENAME, '無効なファイル名です。'],
  [StorageErrorCode.FRONTMATTER_PARSE_ERROR, 'フロントマターの解析に失敗しました。タグ情報がリセットされます。'],
  [StorageErrorCode.CONFIG_IO_ERROR, '設定ファイルの読み書きに失敗しました。'],
  [StorageErrorCode.INVALID_DIRECTORY, '無効なディレクトリパスです。'],
  [StorageErrorCode.DIRECTORY_NOT_WRITABLE, '指定されたディレクトリに書き込み権限がありません。'],
  [StorageErrorCode.UNKNOWN, '予期しないエラーが発生しました。'],
]);
