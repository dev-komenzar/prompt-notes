// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 8-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 8 / task: 8-1 / module: storage

export interface Frontmatter {
  tags: string[];
}

export interface NoteMetadata {
  /** Filename without extension: "2026-04-11T143052" */
  id: string;
  tags: string[];
  /** ISO 8601 datetime derived from filename */
  created_at: string;
  /** First 100 characters of body */
  preview: string;
}

export interface Note {
  id: string;
  frontmatter: Frontmatter;
  body: string;
  created_at: string;
}

export interface NoteFilter {
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface AppConfig {
  notes_dir: string;
}

/** Regex that matches a valid note filename (without .md extension) */
export const NOTE_ID_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}$/;

/** Regex that matches a valid note filename (with .md extension) */
export const NOTE_FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;
