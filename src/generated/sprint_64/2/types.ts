// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 64-1
// @task-title: 2 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-from: docs/design/system_design.md

export interface NoteMetadata {
  /** ファイル名から拡張子を除いた文字列 例: "2026-04-11T143052" */
  id: string;
  tags: string[];
  /** ファイル名から導出した ISO 8601 日時 */
  created_at: string;
  /** 本文先頭 100 文字のプレビュー */
  preview: string;
}

export interface NoteFrontmatter {
  tags: string[];
}

export interface Note {
  id: string;
  frontmatter: NoteFrontmatter;
  body: string;
  created_at: string;
}

export interface NoteFilter {
  /** AND 条件 */
  tags?: string[];
  /** ISO 8601 日付 例: "2026-04-11" */
  date_from?: string;
  /** ISO 8601 日付 例: "2026-04-11" */
  date_to?: string;
}

export interface AppConfig {
  /** 保存ディレクトリの絶対パス */
  notes_dir: string;
}
