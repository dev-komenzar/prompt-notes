// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 設定ファイル読み込み → `Settings { notes_dir }` 返却。ファイル不在時はデフォルト値を返却。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint:24 task:24-1 module:settings
// IPC response type for get_settings command
export interface Settings {
  notes_dir: string;
}

// Default notes_dir values (mirrors Rust backend defaults)
export const DEFAULT_NOTES_DIR_LINUX = "~/.local/share/promptnotes/notes";
export const DEFAULT_NOTES_DIR_MACOS = "~/Library/Application Support/promptnotes/notes";
