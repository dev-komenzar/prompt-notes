// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: ファイル読み込み → frontmatter
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 15
// @task: 15-1

/**
 * Regex for validating YYYY-MM-DDTHHMMSS.md filenames (NNC-S1).
 */
const FILENAME_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})\.md$/;

/**
 * Parses a `YYYY-MM-DDTHHMMSS.md` filename into an ISO 8601 datetime string.
 *
 * @returns ISO 8601 string e.g. "2026-04-10T09:15:30" or null if invalid.
 */
export function parseCreatedAtFromFilename(filename: string): string | null {
  const match = filename.match(FILENAME_REGEX);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Validates that a filename conforms to the YYYY-MM-DDTHHMMSS.md pattern.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}
