// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=46 task=46-1 node=detail:component_architecture,detail:grid_search,detail:storage_fileformat
// Shared type definitions — canonical source is Rust side (module:storage models.rs).
// TypeScript definitions here follow Rust serde output and must not diverge.

/**
 * Represents a single note entry as returned by list_notes / search_notes IPC commands.
 * Canonical owner: module:storage (Rust models.rs)
 */
export interface NoteEntry {
  /** Filename including extension, e.g. "2026-04-04T143052.md" */
  filename: string;
  /** ISO-8601-like datetime string parsed from filename, e.g. "2026-04-04T14:30:52" */
  created_at: string;
  /** Tags extracted from YAML frontmatter. Empty array when absent or parse error. */
  tags: string[];
  /** First 200 characters of note body (frontmatter excluded), for card preview. */
  body_preview: string;
}

/**
 * Application configuration persisted in config.json.
 * Canonical owner: module:settings (Rust config.rs)
 */
export interface Config {
  /** Absolute path to the notes storage directory. */
  notes_dir: string;
}

// ── IPC command argument types ──────────────────────────────────────────

/** Arguments for the create_note IPC command (no arguments required). */
export type CreateNoteArgs = Record<string, never>;

/** Return value of the create_note IPC command. */
export interface CreateNoteResult {
  filename: string;
  path: string;
}

/** Arguments for the save_note IPC command. */
export interface SaveNoteArgs {
  filename: string;
  content: string;
}

/** Arguments for the read_note IPC command. */
export interface ReadNoteArgs {
  filename: string;
}

/** Return value of the read_note IPC command. */
export interface ReadNoteResult {
  content: string;
}

/** Arguments for the delete_note IPC command. */
export interface DeleteNoteArgs {
  filename: string;
}

/** Arguments for the list_notes IPC command. All fields are optional filters. */
export interface ListNotesArgs {
  from_date?: string;
  to_date?: string;
  tag?: string;
}

/** Arguments for the search_notes IPC command. */
export interface SearchNotesArgs {
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}

/** Arguments for the set_config IPC command. */
export interface SetConfigArgs {
  notes_dir: string;
}
