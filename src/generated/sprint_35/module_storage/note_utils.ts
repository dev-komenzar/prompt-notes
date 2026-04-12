// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-2
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Utilities for note ID / filename / timestamp handling on the frontend.
// File naming convention: YYYY-MM-DDTHHMMSS (CONV-1, immutable after creation).

const NOTE_ID_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})$/;

/**
 * Parse a note ID string ("YYYY-MM-DDTHHMMSS") into a Date.
 * Returns null if the format does not match.
 */
export function parseNoteDate(id: string): Date | null {
  const m = id.match(NOTE_ID_RE);
  if (!m) return null;
  const [, year, month, day, hour, min, sec] = m;
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
}

/**
 * Format a note ID as a human-readable date string (ja-JP locale).
 */
export function formatNoteDate(id: string): string {
  const d = parseNoteDate(id);
  if (!d) return id;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format a note ID as a human-readable date-time string.
 */
export function formatNoteDateTime(id: string): string {
  const d = parseNoteDate(id);
  if (!d) return id;
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns true when the note was created within the last `days` calendar days.
 * Used to enforce the default 7-day grid filter on the frontend side.
 */
export function isWithinLastDays(id: string, days: number): boolean {
  const d = parseNoteDate(id);
  if (!d) return false;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d >= cutoff;
}

/**
 * Sort note IDs descending (newest first) using lexicographic order,
 * which is correct for the YYYY-MM-DDTHHMMSS format.
 */
export function sortIdsDesc(ids: string[]): string[] {
  return [...ids].sort((a, b) => b.localeCompare(a));
}

/**
 * Convert a Date to a note ID string (YYYY-MM-DDTHHMMSS).
 * Useful for generating filter boundary values.
 */
export function dateToNoteId(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/**
 * Convert an ISO date string ("YYYY-MM-DD") to the start-of-day note ID
 * boundary used for date range filters.
 */
export function isoDateToStartId(isoDate: string): string {
  return `${isoDate.replace(/-/g, '-')}T000000`;
}

/**
 * Convert an ISO date string ("YYYY-MM-DD") to the end-of-day note ID
 * boundary used for date range filters.
 */
export function isoDateToEndId(isoDate: string): string {
  return `${isoDate.replace(/-/g, '-')}T235959`;
}
