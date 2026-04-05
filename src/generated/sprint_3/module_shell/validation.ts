// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:shell – Client-side validation (defense-in-depth)
// Sprint 3 – Tauri v2 (OQ-005 resolved)
// Authoritative validation is on Rust side (module:storage).
// Client-side checks prevent obviously invalid IPC calls.
// Ref: detail:storage_fileformat §1.1, §4.7 – path traversal prevention

import { FilenameValidationError } from './errors';

/**
 * Pattern matching YYYY-MM-DDTHHMMSS.md with optional collision suffix _N.
 * Mirrors Rust-side regex: ^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$
 */
const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Returns true if the filename conforms to the PromptNotes naming convention
 * and contains no path-traversal characters.
 */
export function isValidFilename(filename: string): boolean {
  if (!FILENAME_PATTERN.test(filename)) return false;
  if (filename.includes('..')) return false;
  if (filename.includes('/')) return false;
  if (filename.includes('\\')) return false;
  return true;
}

/**
 * Throws FilenameValidationError if the filename is invalid.
 * Call before any IPC command that accepts a filename parameter.
 */
export function assertValidFilename(filename: string): void {
  if (!isValidFilename(filename)) {
    throw new FilenameValidationError(filename);
  }
}
