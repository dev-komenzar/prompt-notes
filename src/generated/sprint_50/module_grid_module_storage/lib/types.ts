// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: `module:grid` + `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: detail:storage_fileformat, design:system-design
export interface NoteMetadata {
  id: string;         // "2026-04-11T143052" — ファイル名から拡張子除去
  tags: string[];
  created_at: string; // ISO 8601 — ファイル名から導出
  preview: string;    // 本文先頭 100 文字
}

export interface Note {
  metadata: NoteMetadata;
  body: string;
}

export interface NoteFilter {
  tags?: string[];
  date_from?: string; // ISO 8601 日付 "YYYY-MM-DD"
  date_to?: string;
}

export interface AppConfig {
  notes_dir: string;
}
