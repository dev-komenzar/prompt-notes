// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 7-1
// @task-title: 8 コマンドの TypeScript ラッパー関数が型付きで定義される
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/design/system_design.md
// @generated-by: codd generate --sprint 7

/**
 * Frontmatter structure for a note.
 * Only `tags` field is permitted per NNC-S2.
 */
export interface Frontmatter {
  tags: string[];
}

/**
 * Metadata returned by list_notes / search_notes commands.
 * Canonical definition owned by module:storage (Rust).
 * This is the TypeScript mirror type.
 */
export interface NoteMetadata {
  /** e.g. "2026-04-10T091530.md" */
  filename: string;
  /** Tags extracted from frontmatter */
  tags: string[];
  /** First N characters of body for card display */
  body_preview: string;
  /** ISO 8601 datetime parsed from filename */
  created_at: string;
}

/**
 * Result of create_note command.
 */
export interface CreateNoteResult {
  filename: string;
  path: string;
}

/**
 * Result of read_note command.
 */
export interface ReadNoteResult {
  frontmatter: Frontmatter;
  body: string;
}

/**
 * Result of save_note / delete_note / update_settings commands.
 */
export interface SuccessResult {
  success: boolean;
}

/**
 * Result of list_notes / search_notes commands.
 */
export interface NotesListResult {
  notes: NoteMetadata[];
}

/**
 * Parameters for list_notes command.
 */
export interface ListNotesParams {
  days?: number;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

/**
 * Parameters for search_notes command.
 */
export interface SearchNotesParams {
  query: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

/**
 * Application settings structure.
 */
export interface AppSettings {
  notes_dir: string;
}
