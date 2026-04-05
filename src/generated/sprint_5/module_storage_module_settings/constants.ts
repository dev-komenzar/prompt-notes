// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage,settings]

/**
 * Regex pattern matching valid note filenames.
 * Format: YYYY-MM-DDTHHMMSS.md with optional _N suffix for collision avoidance.
 * Canonical validation is performed by Rust backend; this is for display/client hints only.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Auto-save debounce interval in milliseconds.
 * Applied after EditorView.updateListener detects docChanged.
 */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Search input debounce interval in milliseconds.
 * Applied to full-text search query input in grid view.
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Default number of days for the grid view initial filter.
 * Grid view shows notes created within this many days from today.
 */
export const DEFAULT_FILTER_DAYS = 7;

/**
 * Maximum character length for body_preview in NoteEntry.
 * Actual truncation is performed by Rust backend; this constant is for UI reference.
 */
export const PREVIEW_MAX_LENGTH = 200;

/**
 * Copy success feedback display duration in milliseconds.
 */
export const COPY_FEEDBACK_DURATION_MS = 1500;

/**
 * Frontmatter YAML delimiters.
 */
export const FRONTMATTER_DELIMITER = '---';

/**
 * Date format used for IPC communication (YYYY-MM-DD).
 * Rust backend parses this with chrono::NaiveDate::parse_from_str.
 */
export const IPC_DATE_FORMAT_EXAMPLE = '2026-04-05';
