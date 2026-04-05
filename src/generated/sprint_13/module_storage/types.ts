// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Shared TypeScript type definitions matching Rust-side canonical types.
// Rust module:storage models.rs is the source of truth; TypeScript follows.

export interface NoteEntry {
  filename: string;
  created_at: string;
  tags: string[];
  body_preview: string;
}

export interface Config {
  notes_dir: string;
}

export interface CreateNoteResponse {
  filename: string;
  path: string;
}

export interface ReadNoteResponse {
  content: string;
}

export interface ListNotesParams {
  from_date?: string;
  to_date?: string;
  tag?: string;
}

export interface SearchNotesParams {
  query: string;
  from_date?: string;
  to_date?: string;
  tag?: string;
}

export interface SaveNoteParams {
  filename: string;
  content: string;
}

export interface ReadNoteParams {
  filename: string;
}

export interface DeleteNoteParams {
  filename: string;
}

export interface SetConfigParams {
  notes_dir: string;
}
