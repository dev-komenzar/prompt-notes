// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 75-1
// @task-title: M4（M4-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint_75 / task 75-1 / M4-11
// Canonical owner: module:storage (Rust models.rs). TypeScript side follows Rust.

export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

export interface ReadNoteParams {
  readonly filename: string;
}

export interface ReadNoteResult {
  readonly content: string;
}

export interface SaveNoteParams {
  readonly filename: string;
  readonly content: string;
}

export interface CreateNoteResult {
  readonly filename: string;
  readonly path: string;
}

export interface DeleteNoteParams {
  readonly filename: string;
}

export interface Config {
  readonly notes_dir: string;
}

export interface SetConfigParams {
  readonly notes_dir: string;
}

export interface GridFilterState {
  readonly fromDate: string;
  readonly toDate: string;
  readonly tag: string | undefined;
  readonly query: string;
}
