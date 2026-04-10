// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

/**
 * SearchParams — Filter parameters for search_notes IPC command.
 * Owned by module:grid (frontend). Rust side receives individual optional params.
 * NNC-G1: Default filter is last 7 days.
 * NNC-G2: Tag filter, date filter, and full-text search are mandatory features.
 */
export interface SearchParams {
  /** Full-text search query (case-insensitive substring match) */
  readonly query?: string;
  /** Tag filter (AND condition — notes must contain ALL specified tags) */
  readonly tags?: string[];
  /** Date filter start (YYYY-MM-DD) */
  readonly date_from?: string;
  /** Date filter end (YYYY-MM-DD) */
  readonly date_to?: string;
}

/**
 * ListNotesParams — Parameters for list_notes IPC command.
 */
export interface ListNotesParams {
  readonly days?: number;
  readonly tags?: string[];
  readonly date_from?: string;
  readonly date_to?: string;
}
