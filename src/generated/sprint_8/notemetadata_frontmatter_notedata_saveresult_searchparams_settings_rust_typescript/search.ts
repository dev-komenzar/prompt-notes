// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 8-1
// @task-title: `NoteMetadata`, `Frontmatter`, `NoteData`, `SaveResult`, `SearchParams`, `Settings` の Rust 正規定義と TypeScript ミラー型が一致する
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/grid_search_design.md
// @traceability: sprint-8 task-8-1 — SearchParams TypeScript type definition
// Owned by module:grid (frontend filter state → IPC command argument)

/**
 * Parameters for the `search_notes` IPC command.
 * All fields are optional; omitted fields impose no constraint.
 * Filters are combined with AND logic on the Rust backend.
 *
 * - `query`:     case-insensitive substring search against note body
 * - `tags`:      tag filter (notes must contain ALL specified tags)
 * - `date_from`: inclusive start date (YYYY-MM-DD), compared against filename timestamp
 * - `date_to`:   inclusive end date (YYYY-MM-DD), compared against filename timestamp
 */
export interface SearchParams {
  query?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}
