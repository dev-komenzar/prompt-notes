// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Shared type definitions
// Canonical definitions reside in Rust module:storage (models.rs).
// TypeScript types follow Rust. Do not add fields without updating Rust side.

/** Note metadata returned by list_notes / search_notes IPC commands. */
export interface NoteEntry {
  /** Filename with extension, e.g. "2026-04-04T143052.md" */
  filename: string;
  /** ISO 8601 datetime derived from filename, e.g. "2026-04-04T14:30:52" */
  created_at: string;
  /** Tags parsed from YAML frontmatter */
  tags: string[];
  /** First ~200 characters of note body (frontmatter excluded) */
  body_preview: string;
}

/** Application configuration persisted in config.json by module:settings (Rust). */
export interface Config {
  notes_dir: string;
}

/** Response from create_note IPC command. */
export interface CreateNoteResponse {
  filename: string;
  path: string;
}

/** Response from read_note IPC command. */
export interface ReadNoteResponse {
  content: string;
}

/** Parameters for list_notes IPC command. */
export interface ListNotesParams {
  from_date?: string;
  to_date?: string;
  tag?: string;
}

/** Parameters for search_notes IPC command. */
export interface SearchNotesParams {
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}
