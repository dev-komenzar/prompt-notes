// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `chrono::Local::now().format("%Y-%m-%dT%H%M%S.md")` によるファイル名生成。同一秒衝突時のミリ秒サフィックス付与ロジック。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 11
// @task: 11-1
// @description: Filename validation regex for YYYY-MM-DDTHHMMSS.md and YYYY-MM-DDTHHMMSS_NNN.md formats.

/**
 * Matches the standard filename format: YYYY-MM-DDTHHMMSS.md
 * As specified in NNC-S1 / AC-ST-01.
 */
export const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

/**
 * Matches the collision-avoidance filename format: YYYY-MM-DDTHHMMSS_NNN.md
 * Used when a same-second collision is detected.
 */
export const FILENAME_WITH_MILLIS_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}_\d{3}\.md$/;

/**
 * Matches either the standard or collision-avoidance filename format.
 */
export const FILENAME_ANY_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}(?:_\d{3})?\.md$/;

/**
 * Validates whether a filename conforms to the PromptNotes naming convention.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_ANY_REGEX.test(filename);
}

/**
 * Extracts the created_at ISO 8601 datetime string from a valid note filename.
 * Returns null if the filename does not match the expected format.
 *
 * Example: "2026-04-10T091530.md" → "2026-04-10T09:15:30"
 * Example: "2026-04-10T091530_042.md" → "2026-04-10T09:15:30"
 */
export function parseCreatedAtFromFilename(filename: string): string | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(?:_\d{3})?\.md$/,
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}
