// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=constants
// Application-wide constants derived from design specifications.

/** Auto-save debounce interval in milliseconds (module:editor). */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Search input debounce interval in milliseconds (module:grid). */
export const SEARCH_DEBOUNCE_MS = 300;

/** Default grid view filter: number of days to look back. */
export const DEFAULT_GRID_DAYS = 7;

/** Maximum characters for note body preview in grid cards (Rust side truncates). */
export const BODY_PREVIEW_MAX_CHARS = 200;

/** Copy success feedback display duration in milliseconds. */
export const COPY_FEEDBACK_DURATION_MS = 1500;

/**
 * Filename validation regex matching Rust-side validation.
 * Pattern: YYYY-MM-DDTHHMMSS.md with optional _N suffix for collision avoidance.
 * This is used for client-side sanity checks only — Rust backend is authoritative.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/** YAML frontmatter delimiter line. */
export const FRONTMATTER_DELIMITER = '---';

/** Empty frontmatter template inserted into newly created notes. */
export const FRONTMATTER_TEMPLATE = `---\ntags: []\n---\n\n`;

/** CSS custom property name for frontmatter background color. */
export const FRONTMATTER_BG_CSS_VAR = '--frontmatter-bg';

/** Default frontmatter background color (light blue tint). */
export const FRONTMATTER_BG_DEFAULT = 'rgba(59, 130, 246, 0.08)';
