// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 16-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 16 — Task 16-1 — module:storage
// CoDD traceability: detail:storage_fileformat, detail:component_architecture
// Canonical source: Rust module:storage models.rs (serde::Serialize/Deserialize)
// TypeScript side follows Rust definitions — do not diverge.

/**
 * Represents a note entry returned by list_notes / search_notes IPC commands.
 * Canonical definition owned by module:storage (Rust side).
 */
export interface NoteEntry {
  /** Filename including extension, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** ISO-8601-ish datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  readonly created_at: string;
  /** Tags extracted from YAML frontmatter */
  readonly tags: readonly string[];
  /** First 200 characters of note body (frontmatter excluded) */
  readonly body_preview: string;
}

/**
 * Result of create_note IPC command.
 */
export interface CreateNoteResult {
  /** Generated filename, e.g. "2026-04-04T143052.md" */
  readonly filename: string;
  /** Absolute path to the created file */
  readonly path: string;
}

/**
 * Result of read_note IPC command.
 */
export interface ReadNoteResult {
  /** Full file content including frontmatter */
  readonly content: string;
}

/**
 * Arguments for save_note IPC command.
 */
export interface SaveNoteArgs {
  /** Target filename (must pass validation) */
  readonly filename: string;
  /** Full content including frontmatter to persist */
  readonly content: string;
}

/**
 * Arguments for delete_note IPC command.
 */
export interface DeleteNoteArgs {
  /** Filename to delete (must pass validation) */
  readonly filename: string;
}

/**
 * Arguments for read_note IPC command.
 */
export interface ReadNoteArgs {
  /** Filename to read (must pass validation) */
  readonly filename: string;
}

/**
 * Arguments for list_notes IPC command.
 */
export interface ListNotesArgs {
  /** ISO date string "YYYY-MM-DD" lower bound (inclusive) */
  readonly from_date?: string;
  /** ISO date string "YYYY-MM-DD" upper bound (inclusive) */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}

/**
 * Arguments for search_notes IPC command.
 */
export interface SearchNotesArgs {
  /** Non-empty query string for full-text search */
  readonly query: string;
  /** ISO date string "YYYY-MM-DD" lower bound (inclusive) */
  readonly from_date?: string;
  /** ISO date string "YYYY-MM-DD" upper bound (inclusive) */
  readonly to_date?: string;
  /** Single tag to filter by */
  readonly tag?: string;
}
