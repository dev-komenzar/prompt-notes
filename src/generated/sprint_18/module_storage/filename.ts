// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:18 task:18-1 module:storage
// Client-side filename validation and parsing utilities.
// Authoritative filename generation is Rust-side only (chrono crate).
// These utilities are read-only helpers for display and validation before IPC calls.

/**
 * Regex matching valid note filenames.
 * Format: YYYY-MM-DDTHHMMSS.md with optional _N collision suffix.
 * Must stay in sync with Rust-side validation regex.
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Validates that a filename conforms to the YYYY-MM-DDTHHMMSS.md pattern.
 * Defence-in-depth: Rust backend performs authoritative validation;
 * this prevents obviously invalid filenames from reaching IPC.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Extracts a Date object from a note filename.
 * Returns null if the filename does not match the expected pattern.
 *
 * Example: "2026-04-04T143052.md" → Date(2026-04-04T14:30:52 local)
 */
export function parseFilenameTimestamp(filename: string): Date | null {
  if (!FILENAME_PATTERN.test(filename)) {
    return null;
  }

  // Extract "2026-04-04T143052" from "2026-04-04T143052.md" or "2026-04-04T143052_1.md"
  const stem = filename.replace(/(_\d+)?\.md$/, '');
  // stem = "2026-04-04T143052"
  const match = stem.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // JS months are 0-indexed
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10),
  );

  // Guard against invalid date components (e.g. month 13)
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}
