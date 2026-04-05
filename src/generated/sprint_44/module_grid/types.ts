// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:grid_search §1.2, detail:storage_fileformat §3.4

/**
 * Canonical TypeScript mirror of Rust-side NoteEntry (module:storage models.rs).
 * Rust side is the source of truth; this definition must track it.
 */
export interface NoteEntry {
  readonly filename: string;
  readonly created_at: string;
  readonly tags: readonly string[];
  readonly body_preview: string;
}

/** Parameters accepted by the list_notes IPC command. */
export interface ListNotesParams {
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Parameters accepted by the search_notes IPC command. */
export interface SearchNotesParams {
  readonly query: string;
  readonly from_date?: string;
  readonly to_date?: string;
  readonly tag?: string;
}

/** Parameters accepted by the delete_note IPC command. */
export interface DeleteNoteParams {
  readonly filename: string;
}

/** Represents the currently active filter criteria managed by GridView. */
export interface FilterCriteria {
  readonly fromDate: string;
  readonly toDate: string;
  readonly tag: string | null;
  readonly query: string;
}

/**
 * High-level state of the grid view.
 *
 * State machine (detail:grid_search §2.3):
 *   DefaultView  ─── tag ───►  FilteredByTag
 *   DefaultView  ─── date ──►  FilteredByDate
 *   DefaultView  ─── query ─►  SearchResult
 *   FilteredByTag + date  ───►  FilteredByTagAndDate
 *   Any state    ─── query ─►  SearchResult
 *   SearchResult ─── clear ──►  previous filter state or DefaultView
 */
export type GridViewState =
  | 'default'
  | 'filtered_by_tag'
  | 'filtered_by_date'
  | 'filtered_by_tag_and_date'
  | 'search_result';

/** Loading status of the grid data fetch cycle. */
export type LoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Complete snapshot of grid view state at a point in time. */
export interface GridSnapshot {
  readonly notes: readonly NoteEntry[];
  readonly filterCriteria: FilterCriteria;
  readonly viewState: GridViewState;
  readonly loadingStatus: LoadingStatus;
  readonly error: string | null;
}

/** Event dispatched by NoteCard on click. */
export interface CardClickEvent {
  readonly filename: string;
}

/** Event dispatched by TagFilter on tag selection change. */
export interface TagChangeEvent {
  readonly tag: string | null;
}

/** Event dispatched by DateFilter on date range change. */
export interface DateChangeEvent {
  readonly fromDate: string;
  readonly toDate: string;
}

/** View identifiers used by App.svelte's currentView state variable. */
export type AppView = 'grid' | 'editor' | 'settings';
