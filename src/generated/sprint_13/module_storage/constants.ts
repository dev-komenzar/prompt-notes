// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Centralised configuration constants for module:storage consumers.

/** Auto-save debounce interval in milliseconds (module:editor). */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Search input debounce interval in milliseconds (module:grid). */
export const SEARCH_DEBOUNCE_MS = 300;

/** Number of characters included in NoteEntry.body_preview by Rust backend. */
export const BODY_PREVIEW_LENGTH = 200;

/** Default number of days shown in the grid view filter. */
export const DEFAULT_FILTER_DAYS = 7;

/** Regex pattern enforced by Rust backend for valid note filenames. */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;
