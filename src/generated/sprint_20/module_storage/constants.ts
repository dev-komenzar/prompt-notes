// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 20-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=20 task=20-1 module=storage
// Platform constants for module:storage.
// Actual directory resolution is performed by the Rust backend (dirs crate).
// These constants are informational references for the frontend layer.

/**
 * Application identifier used in data directory paths.
 */
export const APP_NAME = 'promptnotes' as const;

/**
 * Subdirectory under the application data directory where notes are stored.
 */
export const NOTES_SUBDIR = 'notes' as const;

/**
 * Config filename stored alongside the notes directory.
 */
export const CONFIG_FILENAME = 'config.json' as const;

/**
 * Expected default paths per platform (informational).
 * The Rust backend determines actual paths via the `dirs` crate.
 */
export const DEFAULT_PATHS = {
  linux: {
    base: '~/.local/share/promptnotes',
    notes: '~/.local/share/promptnotes/notes/',
    config: '~/.local/share/promptnotes/config.json',
  },
  macos: {
    base: '~/Library/Application Support/promptnotes',
    notes: '~/Library/Application Support/promptnotes/notes/',
    config: '~/Library/Application Support/promptnotes/config.json',
  },
} as const;

/**
 * Filename pattern used by module:storage (Rust side).
 * Format: YYYY-MM-DDTHHMMSS.md  (with optional _N suffix for collisions)
 * Validation regex is enforced by the Rust backend; this is for reference only.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/ as const;

/**
 * Frontmatter delimiters.
 */
export const FRONTMATTER_DELIMITER = '---' as const;

/**
 * Default body preview length (characters) produced by Rust backend.
 */
export const BODY_PREVIEW_MAX_LENGTH = 200 as const;

/**
 * Default number of days shown in grid view.
 */
export const DEFAULT_FILTER_DAYS = 7 as const;
