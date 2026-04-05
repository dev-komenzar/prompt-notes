// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=filename-utils
// Filename validation and parsing utilities.
// Filename generation is exclusively owned by module:storage (Rust / chrono).
// These utilities are for client-side display and validation only.

import { FILENAME_PATTERN } from './constants';

/**
 * Validate that a filename matches the YYYY-MM-DDTHHMMSS.md pattern.
 * Client-side sanity check only — Rust backend is the authoritative validator.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Extract a human-readable date string from a note filename.
 * Input:  "2026-04-04T143052.md"
 * Output: "2026-04-04 14:30"
 *
 * Returns the original filename if parsing fails.
 */
export function filenameToDisplayDate(filename: string): string {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return filename;
  const [, datePart, h, m] = match;
  return `${datePart} ${h}:${m}`;
}

/**
 * Extract the date portion (YYYY-MM-DD) from a note filename.
 * Returns null if the filename doesn't match the expected pattern.
 */
export function filenameToDateString(filename: string): string | null {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})T/);
  return match ? match[1] : null;
}
