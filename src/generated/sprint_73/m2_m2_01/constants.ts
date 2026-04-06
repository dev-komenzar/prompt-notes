// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 73-1
// @task-title: M2（M2-01）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// tracer: sprint_73/m2_m2_01 | OQ-SF-001 | suffix-based collision resolution
// convention: module:storage — ファイル名は YYYY-MM-DDTHHMMSS.md 形式。バリデーション正規表現定義。

/**
 * Regex for validating PromptNotes filenames.
 * Matches: YYYY-MM-DDTHHMMSS.md and YYYY-MM-DDTHHMMSS_N.md
 * Groups: (date)(time)(optional _suffix)
 *
 * From storage_fileformat_design §1.1:
 *   ^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$
 */
export const FILENAME_REGEX = /^(\d{4}-\d{2}-\d{2})T(\d{6})(?:_(\d+))?\.md$/;

/**
 * Strict filename pattern for path-traversal prevention.
 * Rejects any filename containing "..", "/", or "\".
 */
export const PATH_TRAVERSAL_CHARS = /[/\\]|\.\./;

/**
 * File extension for all note files.
 */
export const NOTE_EXTENSION = '.md';

/**
 * Format string for timestamp generation: YYYY-MM-DDTHHMMSS
 */
export const TIMESTAMP_FORMAT = 'YYYY-MM-DDTHHMMSS';

/**
 * Maximum suffix number to prevent infinite loop in collision resolution.
 * If exceeded, indicates a systemic issue rather than normal collision.
 */
export const MAX_SUFFIX = 9999;

/**
 * Separator between base timestamp and collision suffix.
 */
export const SUFFIX_SEPARATOR = '_';
