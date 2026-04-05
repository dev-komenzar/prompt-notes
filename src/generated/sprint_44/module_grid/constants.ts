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
// design-ref: detail:grid_search §4.1, §4.7

/** Number of days for the default grid view filter (CONV-GRID-1). */
export const DEFAULT_FILTER_DAYS = 7;

/**
 * Debounce interval in ms for the search text box (detail:grid_search §4.2).
 * Independent of the editor auto-save debounce (500 ms).
 */
export const SEARCH_DEBOUNCE_MS = 300;

/** Maximum characters in body_preview returned by module:storage. */
export const BODY_PREVIEW_MAX_CHARS = 200;

/** CSS Columns default column width for Masonry layout. */
export const MASONRY_COLUMN_MIN_WIDTH_PX = 280;

/** Number of CSS columns to use as upper-bound. */
export const MASONRY_MAX_COLUMNS = 4;

/** Column gap in px for the Masonry grid. */
export const MASONRY_COLUMN_GAP_PX = 16;
