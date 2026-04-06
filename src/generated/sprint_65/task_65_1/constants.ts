// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=editor+grid+settings
// Application-wide constants. Centralized to prevent magic numbers in components.

/**
 * Auto-save debounce interval in milliseconds (module:editor).
 * After the user stops typing for this duration, content is saved via save_note IPC.
 * OQ-004: May be adjusted after prototype user testing (500ms is the baseline).
 */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Search input debounce interval in milliseconds (module:grid).
 * After the user stops typing in the search box, search_notes IPC is invoked.
 * OQ-GRID-001: May be adjusted after prototype user testing.
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Default number of days for the grid view filter (CONV-GRID-1).
 * Grid view shows notes from the past N days by default.
 */
export const DEFAULT_FILTER_DAYS = 7;

/**
 * Maximum characters for body preview in NoteEntry (set by module:storage Rust side).
 * Provided here for UI layout calculations.
 */
export const BODY_PREVIEW_MAX_CHARS = 200;

/**
 * Duration in milliseconds for copy-success feedback display.
 * OQ-E01: Feedback style (icon change vs tooltip) to be determined in prototype.
 */
export const COPY_FEEDBACK_DURATION_MS = 1500;

/**
 * CSS class applied to frontmatter lines by the CodeMirror 6 decoration extension.
 */
export const FRONTMATTER_LINE_CLASS = "cm-frontmatter-line";

/**
 * CSS custom property for frontmatter background color.
 * Can be overridden for dark mode / theme changes.
 */
export const FRONTMATTER_BG_VAR = "--frontmatter-bg";

/**
 * Default frontmatter background color (light blue, low opacity).
 */
export const FRONTMATTER_BG_DEFAULT = "rgba(59, 130, 246, 0.08)";
