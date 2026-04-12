// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 16-1
// @task-title: フロントエンド基盤
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: design:system-design §2.4, detail:component_architecture §3.2
// @sprint: 16 | @task: 16-1 | @module: src/lib/types.ts

/**
 * ノートのメタデータ。list_notes / search_notes の IPC 応答に対応する。
 * id はファイル名から拡張子を除いた文字列（例: "2026-04-04T143205"）。
 * created_at はファイル名から導出した ISO 8601 日時。frontmatter には含まない。
 */
export interface NoteMetadata {
  /** ファイル名から拡張子を除いた ID。例: "2026-04-04T143205" */
  id: string;
  /** frontmatter の tags フィールド */
  tags: string[];
  /** ファイル名から導出した作成日時 (ISO 8601) */
  created_at: string;
  /** 本文先頭 100 文字のプレビュー */
  preview: string;
}

/**
 * ノートの全データ。read_note の IPC 応答に対応する。
 */
export interface Note {
  metadata: NoteMetadata;
  /** 本文全体（frontmatter を除く Markdown テキスト） */
  body: string;
}

/**
 * list_notes / search_notes に渡すフィルタ条件。
 * tags は AND 条件。date_from / date_to は ISO 8601 日付文字列 (YYYY-MM-DD)。
 */
export interface NoteFilter {
  /** AND 条件で適用するタグ一覧 */
  tags?: string[];
  /** フィルタ開始日 (ISO 8601 日付, 例: "2026-04-01") */
  date_from?: string;
  /** フィルタ終了日 (ISO 8601 日付, 例: "2026-04-11") */
  date_to?: string;
}

/**
 * アプリケーション設定。get_config / set_config の IPC ペイロードに対応する。
 * notes_dir は Rust バックエンドが管理する絶対パス。
 * フロントエンドはこの値を直接操作せず、invoke('set_config') 経由でのみ変更する。
 */
export interface AppConfig {
  /**
   * ノート保存ディレクトリの絶対パス。
   * デフォルト: Linux = ~/.local/share/promptnotes/notes/
   *             macOS  = ~/Library/Application Support/promptnotes/notes/
   */
  notes_dir: string;
}
