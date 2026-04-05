// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard, detail:component_architecture, detail:storage_fileformat

/**
 * Represents a note entry returned from module:storage (Rust backend).
 * Canonical definition is Rust-side models.rs; this TypeScript definition follows.
 */
export interface NoteEntry {
  filename: string;
  created_at: string;
  tags: string[];
  body_preview: string;
}

/**
 * Response from create_note IPC command.
 */
export interface CreateNoteResponse {
  filename: string;
  path: string;
}

/**
 * Response from read_note IPC command.
 */
export interface ReadNoteResponse {
  content: string;
}

/**
 * Application configuration. Canonical owner: module:settings (Rust backend).
 */
export interface Config {
  notes_dir: string;
}

/**
 * Editor view state — tracks which note is currently loaded.
 */
export interface EditorState {
  currentFilename: string | null;
  isDirty: boolean;
  isLoading: boolean;
}
