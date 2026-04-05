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
// Filename parsing utilities for the frontend layer.
// Filename generation is exclusively owned by module:storage (Rust / chrono).
// The frontend MUST NOT generate filenames; it only parses them for display.

import { FILENAME_PATTERN } from './constants';

/**
 * Validates that a filename conforms to the YYYY-MM-DDTHHMMSS(_N)?.md pattern.
 * This is a client-side convenience check; authoritative validation is Rust-side.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Parses a note filename into a Date object.
 * Returns null if the filename does not match the expected pattern.
 *
 * Example: "2026-04-04T143052.md" → Date representing 2026-04-04 14:30:52 local time
 */
export function parseFilenameToDate(filename: string): Date | null {
  if (!isValidNoteFilename(filename)) {
    return null;
  }

  // Extract the timestamp portion before .md (and optional _N suffix)
  const base = filename.replace(/(_\d+)?\.md$/, '');
  // base is e.g. "2026-04-04T143052"

  if (base.length !== 17) {
    return null;
  }

  const year = parseInt(base.substring(0, 4), 10);
  const month = parseInt(base.substring(5, 7), 10) - 1; // 0-indexed
  const day = parseInt(base.substring(8, 10), 10);
  const hour = parseInt(base.substring(11, 13), 10);
  const minute = parseInt(base.substring(13, 15), 10);
  const second = parseInt(base.substring(15, 17), 10);

  const date = new Date(year, month, day, hour, minute, second);

  // Validate that the Date components match (catches invalid dates like Feb 30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return null;
  }

  return date;
}

/**
 * Formats a Date to the YYYY-MM-DD string used as IPC filter parameter.
 * Used by module:grid to compute from_date / to_date for list_notes.
 */
export function formatDateForFilter(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a created_at string (from NoteEntry) into a human-readable display string.
 * Input: "2026-04-04T14:30:52" → Output: "2026-04-04 14:30"
 */
export function formatCreatedAtForDisplay(createdAt: string): string {
  // Trim seconds for display brevity
  if (createdAt.length >= 16) {
    return createdAt.substring(0, 10) + ' ' + createdAt.substring(11, 16);
  }
  return createdAt;
}
