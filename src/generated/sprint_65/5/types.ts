// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: editor,grid,storage,settings

export interface NoteMetadata {
  id: string;           // "2026-04-11T143052" (filename without extension)
  tags: string[];
  created_at: string;   // ISO 8601 derived from filename
  preview: string;      // first 100 chars of body
}

export interface Note {
  metadata: NoteMetadata;
  body: string;
}

export interface NoteFilter {
  tags?: string[];
  date_from?: string;   // ISO 8601 date "YYYY-MM-DD"
  date_to?: string;
}

export interface AppConfig {
  notes_dir: string;
}

export interface Frontmatter {
  tags: string[];
}

export type CopyStatus = 'idle' | 'copied' | 'error';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface EditorState {
  currentNoteId: string | null;
  body: string;
  tags: string[];
  saveStatus: SaveStatus;
}

export interface GridFilters extends NoteFilter {
  query: string;
}
