// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint:12, task:12-1, module:shell
// @depends-on: docs/detailed_design/component_architecture.md §3.2
// @depends-on: docs/detailed_design/storage_fileformat_design.md §3.2

/**
 * Unique note identifier derived from filename (without extension).
 * Format: YYYY-MM-DDTHHMMSS
 */
export type NoteId = string;

/**
 * ISO 8601 date string (YYYY-MM-DD).
 */
export type IsoDate = string;

/**
 * ISO 8601 datetime string.
 */
export type IsoDateTime = string;

/**
 * Metadata returned by list_notes and search_notes Tauri commands.
 * preview contains at most 100 chars of body text.
 */
export interface NoteMetadata {
  id: NoteId;
  tags: string[];
  created_at: IsoDateTime;
  preview: string;
}

/**
 * Full note data returned by read_note.
 */
export interface Note {
  id: NoteId;
  frontmatter: { tags: string[] };
  body: string;
  created_at: IsoDateTime;
}

/**
 * Filter parameters accepted by list_notes and search_notes.
 * All fields are optional; present fields are combined with AND semantics.
 */
export interface NoteFilter {
  tags?: string[];
  date_from?: IsoDate;
  date_to?: IsoDate;
}

/**
 * Application configuration persisted in config.json by the Rust backend.
 */
export interface AppConfig {
  notes_dir: string;
}
