// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Shared constants for module:storage consumers.

/** Debounce interval for auto-save (milliseconds). Design spec: 500ms. */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Debounce interval for search input (milliseconds). Design spec: 300ms. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Maximum body preview length (characters). Rust-side truncation target. */
export const BODY_PREVIEW_MAX_LENGTH = 200;

/** Default number of days for grid view filter. */
export const DEFAULT_FILTER_DAYS = 7;

/**
 * Filename validation pattern.
 * Matches: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md (collision suffix).
 * Must stay in sync with Rust-side regex in module:storage.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/** YAML frontmatter delimiter */
export const FRONTMATTER_DELIMITER = '---';
