// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Application Constants

/** Auto-save debounce interval in milliseconds */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Search input debounce interval in milliseconds */
export const SEARCH_DEBOUNCE_MS = 300;

/** Default number of days shown in grid view */
export const DEFAULT_FILTER_DAYS = 7;

/** Maximum characters for body_preview (Rust side truncation, mirrored here for reference) */
export const BODY_PREVIEW_MAX_CHARS = 200;

/** Copy success feedback display duration in milliseconds */
export const COPY_FEEDBACK_DURATION_MS = 1500;

/** YAML frontmatter delimiter */
export const FRONTMATTER_DELIMITER = '---';

/**
 * Regex pattern for valid note filenames.
 * Matches YYYY-MM-DDTHHMMSS.md with optional _N collision suffix.
 * Authoritative validation is on Rust side; this is for client-side display/guard only.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/** CSS class applied to frontmatter lines in CodeMirror 6 */
export const CM_FRONTMATTER_LINE_CLASS = 'cm-frontmatter-line';

/** CSS variable name for frontmatter background color */
export const FRONTMATTER_BG_VAR = '--frontmatter-bg';

/** Default frontmatter background color (light blue, 8% opacity) */
export const FRONTMATTER_BG_DEFAULT = 'rgba(59, 130, 246, 0.08)';
