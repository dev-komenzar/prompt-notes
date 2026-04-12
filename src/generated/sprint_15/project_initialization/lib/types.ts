// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: フロントエンド基盤
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:15 task:15-1
// @generated-by: codd implement --sprint 15

/**
 * Note identifier: filename without extension, e.g. "2026-04-11T143052"
 * Format: YYYY-MM-DDTHHMMSS (RBC-3: immutable after creation)
 */
export interface NoteMetadata {
  id: string;
  tags: string[];
  created_at: string; // ISO 8601, derived from filename
  preview: string;    // first 100 chars of body
}

/**
 * Full note data returned by read_note IPC command
 */
export interface Note {
  metadata: NoteMetadata;
  body: string;
}

/**
 * Filter parameters for list_notes / search_notes IPC commands
 * All fields are AND-combined when multiple are specified.
 */
export interface NoteFilter {
  tags?: string[];      // AND condition: notes must contain all listed tags
  date_from?: string;   // ISO 8601 date string, inclusive
  date_to?: string;     // ISO 8601 date string, inclusive
}

/**
 * Application configuration persisted in config.json via Rust backend.
 * Frontend must never write this directly to localStorage or IndexedDB.
 */
export interface AppConfig {
  notes_dir: string; // absolute path to notes directory
}
