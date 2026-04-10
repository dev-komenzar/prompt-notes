// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `tauri::Builder` 初期化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// sprint: 5, task: 5-1, module: shell

/**
 * Mirrors Rust struct NoteMetadata (src-tauri/src/storage/types.rs).
 * Canonical owner: module:storage (Rust).
 */
export interface NoteMetadata {
  filename: string;
  tags: string[];
  body_preview: string;
  created_at: string;
}

/**
 * Mirrors Rust struct Frontmatter.
 * Only `tags` is permitted per NNC-S2.
 */
export interface Frontmatter {
  tags: string[];
}

/**
 * Returned by read_note IPC command.
 */
export interface NoteData {
  frontmatter: Frontmatter;
  body: string;
}

/**
 * Returned by create_note IPC command.
 */
export interface CreateNoteResult {
  filename: string;
  path: string;
}

/**
 * Returned by save_note / delete_note IPC commands.
 */
export interface OperationResult {
  success: boolean;
}

/**
 * Returned by list_notes / search_notes IPC commands.
 */
export interface NoteListResult {
  notes: NoteMetadata[];
}
