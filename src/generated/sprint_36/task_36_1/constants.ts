// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
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
// CoDD trace: detail:editor_clipboard, detail:grid_search, detail:storage_fileformat

/** Default number of days for the grid view filter (CONV-GRID-1). */
export const DEFAULT_FILTER_DAYS = 7;

/** Auto-save debounce interval in milliseconds (module:editor). */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Search input debounce interval in milliseconds (module:grid). */
export const SEARCH_DEBOUNCE_MS = 300;

/** Maximum characters for body_preview in NoteEntry (Rust-side truncation). */
export const BODY_PREVIEW_MAX_CHARS = 200;

/** Copy success feedback display duration in milliseconds. */
export const COPY_FEEDBACK_DURATION_MS = 1500;

/** YAML frontmatter delimiter. */
export const FRONTMATTER_DELIMITER = "---";

/**
 * Frontmatter template for newly created notes.
 * Generated on the frontend for initial editor content.
 * Persisted via auto-save through save_note IPC command.
 */
export const FRONTMATTER_TEMPLATE = `---\ntags: []\n---\n\n`;

/**
 * Regex pattern for valid note filenames.
 * Mirrors Rust-side validation: YYYY-MM-DDTHHMMSS.md with optional _N suffix.
 * Used for client-side pre-validation only; Rust backend is authoritative.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;
