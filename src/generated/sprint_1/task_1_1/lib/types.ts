// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 担当モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Shared type definitions for PromptNotes frontend.
// Single source of truth for NoteMetadata, Note, NoteFilter, AppConfig.
// Rust-side structs in src-tauri/src/models.rs must mirror these definitions.

export interface Frontmatter {
  tags: string[];
}

/** Full note data returned by read_note IPC command */
export interface Note {
  id: string;           // e.g. "2026-04-11T143052"
  frontmatter: Frontmatter;
  body: string;
  created_at: string;   // ISO 8601, derived from filename
}

/** Note metadata returned by list_notes / search_notes IPC commands */
export interface NoteMetadata {
  id: string;           // e.g. "2026-04-11T143052"
  tags: string[];
  created_at: string;   // ISO 8601, derived from filename
  preview: string;      // First 100 chars of body
}

/** Filter parameters for list_notes and search_notes */
export interface NoteFilter {
  tags?: string[];      // AND condition
  date_from?: string;   // ISO 8601 date e.g. "2026-04-04"
  date_to?: string;     // ISO 8601 date e.g. "2026-04-11"
}

/** Application configuration stored in config.json */
export interface AppConfig {
  notes_dir: string;    // Absolute path to notes directory
}
