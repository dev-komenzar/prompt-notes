// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=22, task=22-1, module=module:shell
// Canonical TypeScript type definitions for the Tauri IPC boundary.
// Rust side (module:storage models.rs, module:settings config.rs) is the source of truth.
// These definitions must follow the Rust serde::Serialize/Deserialize structs.

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust models.rs)
 */
export interface NoteEntry {
  /** Filename in YYYY-MM-DDTHHMMSS.md format, e.g. "2026-04-04T143052.md" */
  filename: string;
  /** ISO-style datetime string parsed from filename, e.g. "2026-04-04T14:30:52" */
  created_at: string;
  /** Tags extracted from YAML frontmatter */
  tags: string[];
  /** First 200 characters of the note body for card preview */
  body_preview: string;
}

/**
 * Application configuration.
 * Canonical owner: module:settings (Rust config.rs)
 */
export interface Config {
  /** Absolute path to the notes storage directory */
  notes_dir: string;
}

/** Response from create_note IPC command */
export interface CreateNoteResponse {
  /** Generated filename in YYYY-MM-DDTHHMMSS.md format */
  filename: string;
  /** Absolute filesystem path to the created file */
  path: string;
}

/** Response from read_note IPC command */
export interface ReadNoteResponse {
  /** Full file content including frontmatter */
  content: string;
}

/** Arguments for save_note IPC command */
export interface SaveNoteArgs {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  filename: string;
  /** Full file content including frontmatter to overwrite */
  content: string;
}

/** Arguments for read_note IPC command */
export interface ReadNoteArgs {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  filename: string;
}

/** Arguments for delete_note IPC command */
export interface DeleteNoteArgs {
  /** Target filename (must match YYYY-MM-DDTHHMMSS.md pattern) */
  filename: string;
}

/** Arguments for list_notes IPC command */
export interface ListNotesArgs {
  /** Start date filter in YYYY-MM-DD format */
  from_date?: string;
  /** End date filter in YYYY-MM-DD format */
  to_date?: string;
  /** Tag filter (single tag) */
  tag?: string;
}

/** Arguments for search_notes IPC command */
export interface SearchNotesArgs {
  /** Full-text search query (case-insensitive substring match) */
  query: string;
  /** Start date filter in YYYY-MM-DD format */
  from_date?: string;
  /** End date filter in YYYY-MM-DD format */
  to_date?: string;
  /** Tag filter (single tag) */
  tag?: string;
}

/** Arguments for set_config IPC command */
export interface SetConfigArgs {
  /** New notes directory path (validated by Rust backend) */
  notes_dir: string;
}
