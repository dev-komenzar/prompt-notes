// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Type definitions
// Canonical NoteEntry owned by module:storage (Rust). TS side follows Rust serde output.

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
  fromDate: string;
  toDate: string;
  selectedTag: string | undefined;
  searchQuery: string;
}

export interface GridState {
  notes: readonly NoteEntry[];
  filterState: GridFilterState;
  availableTags: readonly string[];
  isLoading: boolean;
  error: string | null;
}

export interface MasonryConfig {
  readonly columnMinWidth: number;
  readonly gap: number;
  readonly minColumns: number;
  readonly maxColumns: number;
}

export interface MasonryLayout {
  readonly columnCount: number;
  readonly containerStyle: Readonly<Record<string, string>>;
  readonly itemStyle: Readonly<Record<string, string>>;
}

export interface TagBadge {
  readonly label: string;
  readonly isActive: boolean;
}

export type ViewName = 'grid' | 'editor' | 'settings';

export interface NavigateToEditorEvent {
  readonly type: 'navigate-to-editor';
  readonly filename: string;
}

export interface CardClickEvent {
  readonly filename: string;
}

export interface TagChangeEvent {
  readonly tag: string | undefined;
}

export interface DateChangeEvent {
  readonly fromDate: string;
  readonly toDate: string;
}
