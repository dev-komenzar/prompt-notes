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

import { FILENAME_REGEX } from '../constants/conventions';

/**
 * Validates that a filename conforms to YYYY-MM-DDTHHMMSS.md format.
 * NNC-S1 / AC-ST-01 / FC-ST-01: Filename rule is non-negotiable.
 *
 * @param filename - The filename to validate
 * @returns true if filename matches the required pattern
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

/**
 * Parses created_at datetime string from a valid note filename.
 * Filename format: YYYY-MM-DDTHHMMSS.md → ISO 8601: YYYY-MM-DDTHH:MM:SS
 *
 * @param filename - A valid note filename
 * @returns ISO 8601 datetime string, or null if filename is invalid
 */
export function parseCreatedAtFromFilename(filename: string): string | null {
  if (!isValidNoteFilename(filename)) {
    return null;
  }
  const base = filename.replace('.md', '');
  // YYYY-MM-DDTHHMMSS → YYYY-MM-DDTHH:MM:SS
  const datePart = base.slice(0, 10); // YYYY-MM-DD
  const timePart = base.slice(11);    // HHMMSS
  const hours = timePart.slice(0, 2);
  const minutes = timePart.slice(2, 4);
  const seconds = timePart.slice(4, 6);
  return `${datePart}T${hours}:${minutes}:${seconds}`;
}

/**
 * Validates that a filename does not contain path traversal characters.
 * Security: prevents directory traversal attacks.
 *
 * @param filename - The filename to check
 * @returns true if filename is safe (no path separators)
 */
export function isSafeFilename(filename: string): boolean {
  return !filename.includes('/') && !filename.includes('\\') && !filename.includes('..');
}
