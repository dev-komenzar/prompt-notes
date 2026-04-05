// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// NoteEntry canonical owner: module:storage (Rust side). TS definition follows Rust serde output.

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

export interface GridFilterState {
  readonly fromDate: string;
  readonly toDate: string;
  readonly tag: string | undefined;
  readonly query: string;
}

export interface GridViewState {
  readonly notes: readonly NoteEntry[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly filters: GridFilterState;
  readonly availableTags: readonly string[];
}

export type ViewName = 'grid' | 'editor' | 'settings';

export interface CardClickEvent {
  readonly filename: string;
}
