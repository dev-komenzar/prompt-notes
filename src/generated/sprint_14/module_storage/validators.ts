// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Filename validation — mirrors Rust-side validation in module:storage.
// Primary enforcement is on Rust side; this provides early client-side checks.

import { FILENAME_PATTERN } from './constants';

/**
 * Validates that a filename conforms to the YYYY-MM-DDTHHMMSS.md pattern.
 * Rejects path traversal attempts (../, /, \).
 *
 * @param filename - The filename to validate.
 * @returns true if the filename is valid.
 */
export function isValidFilename(filename: string): boolean {
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  return FILENAME_PATTERN.test(filename);
}

/**
 * Asserts that a filename is valid, throwing an error if not.
 * Use at IPC call boundaries for defence-in-depth alongside Rust-side validation.
 *
 * @param filename - The filename to validate.
 * @throws Error if filename is invalid.
 */
export function assertValidFilename(filename: string): void {
  if (!isValidFilename(filename)) {
    throw new Error(
      `Invalid filename: "${filename}". Expected pattern YYYY-MM-DDTHHMMSS.md`
    );
  }
}
