// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 40-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// Sprint 40 — shared TypeScript types for module:grid

/** ノートのメタデータ（list_notes / search_notes の IPC 応答） */
export interface NoteMetadata {
  /** ファイル名から拡張子を除いた ID。例: "2026-04-11T143052" */
  id: string;
  tags: string[];
  /** ISO 8601 形式の作成日時（ファイル名から導出） */
  created_at: string;
  /** 本文先頭 100 文字のプレビュー */
  preview: string;
}

/** list_notes / search_notes に渡すフィルタパラメータ */
export interface NoteFilter {
  tags?: string[];
  date_from?: string;
  date_to?: string;
}
