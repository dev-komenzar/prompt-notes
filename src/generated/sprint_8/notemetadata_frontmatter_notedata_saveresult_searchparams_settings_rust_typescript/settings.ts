// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 8-1
// @task-title: `NoteMetadata`, `Frontmatter`, `NoteData`, `SaveResult`, `SearchParams`, `Settings` の Rust 正規定義と TypeScript ミラー型が一致する
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @traceability: sprint-8 task-8-1 — Settings TypeScript mirror type
// Canonical definition: Rust backend settings management logic
// Returned by `get_settings`, accepted by `update_settings` IPC commands.

/**
 * Mirror of Rust `Settings` struct.
 *
 * - `notes_dir`: absolute path to the notes storage directory.
 *   Defaults are OS-specific:
 *     Linux:  ~/.local/share/promptnotes/notes/
 *     macOS:  ~/Library/Application Support/promptnotes/notes/
 *   User may change this via the settings screen; validation is performed
 *   exclusively on the Rust backend.
 */
export interface Settings {
  notes_dir: string;
}
