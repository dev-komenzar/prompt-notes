// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

/**
 * Non-negotiable conventions enforced at compile/runtime.
 * Violation of any convention is a release blocker.
 */

/** NNC-S1: Filename pattern — YYYY-MM-DDTHHMMSS.md, immutable after creation */
export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

/** NNC-S2: Allowed frontmatter fields — only 'tags' */
export const ALLOWED_FRONTMATTER_FIELDS: readonly string[] = ['tags'] as const;

/** NNC-G1: Default grid filter — last 7 days */
export const DEFAULT_FILTER_DAYS = 7;

/** NNC-E1: Frontmatter CSS class for background decoration */
export const FRONTMATTER_BG_CLASS = 'cm-frontmatter-bg';

/** NNC-S3: Auto-save debounce range (ms) */
export const AUTOSAVE_DEBOUNCE_MIN_MS = 500;
export const AUTOSAVE_DEBOUNCE_MAX_MS = 1000;
export const AUTOSAVE_DEBOUNCE_DEFAULT_MS = 750;

/** NNC-G2: Search debounce (ms) */
export const SEARCH_DEBOUNCE_MS = 300;

/** Copy button feedback duration (ms) */
export const COPY_FEEDBACK_DURATION_MS = 2000;

/** NNC-S4: Default notes directories by platform */
export const DEFAULT_NOTES_DIR = {
  linux: '~/.local/share/promptnotes/notes/',
  macos: '~/Library/Application Support/promptnotes/notes/',
} as const;

/** NNC-S4: Config file paths by platform */
export const CONFIG_FILE_PATH = {
  linux: '~/.config/promptnotes/config.json',
  macos: '~/Library/Application Support/promptnotes/config.json',
} as const;

/** Frontmatter regex for extracting YAML block from document text */
export const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n/;

/** Performance targets (ms) */
export const PERFORMANCE_TARGETS = {
  NEW_NOTE_FOCUS_MS: 200,
  COPY_CLIPBOARD_MS: 50,
  AUTOSAVE_IO_MS: 100,
  EDITOR_LOAD_MS: 300,
  SEARCH_RESPONSE_MS: 100,
  CREATE_NOTE_MS: 50,
  SAVE_NOTE_MS: 50,
  READ_NOTE_MS: 50,
  LIST_NOTES_MS: 200,
  DELETE_NOTE_MS: 50,
} as const;
