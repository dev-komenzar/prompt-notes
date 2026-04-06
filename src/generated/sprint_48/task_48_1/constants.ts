// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=constants
// Application-wide constants for PromptNotes.
// Values here reflect confirmed design decisions and release-blocking constraints.

/** Debounce interval (ms) for editor auto-save. Design default: 500ms (OQ-004). */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Debounce interval (ms) for grid view search input. Design default: 300ms (OQ-GRID-001). */
export const SEARCH_DEBOUNCE_MS = 300;

/** Default number of days shown in the grid view on mount (CONV-GRID-1). */
export const DEFAULT_GRID_DAYS = 7;

/** Maximum characters for body_preview returned by Rust (module:storage). */
export const BODY_PREVIEW_MAX_CHARS = 200;

/** Copy-success feedback display duration (ms). */
export const COPY_FEEDBACK_DURATION_MS = 1500;

/** YAML frontmatter delimiter. */
export const FRONTMATTER_DELIMITER = "---";

/**
 * Empty frontmatter template inserted into newly created notes.
 * Trailing newline ensures the cursor lands on the first body line.
 */
export const EMPTY_FRONTMATTER_TEMPLATE = `---\ntags: []\n---\n\n`;

/**
 * Regex that matches valid PromptNotes filenames.
 * Mirrors the Rust-side validation regex for path-traversal prevention.
 * Accepts optional _N suffix for same-second collision avoidance.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;
