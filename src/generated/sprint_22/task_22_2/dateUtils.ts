// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-2
// @task-title: 本文のみ対象）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability sprint:22 task:22-2 module:storage
// Parses dates from YYYY-MM-DDTHHMMSS.md filenames.
// Used by the frontend to display created_at and to construct date filter params.

const FILENAME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})\.md$/;

/**
 * Returns an ISO 8601 string "YYYY-MM-DDTHH:MM:SS" from a note filename,
 * or null if the filename does not match the expected format.
 */
export function parseCreatedAt(filename: string): string | null {
  const m = FILENAME_RE.exec(filename);
  if (!m) return null;
  const [, yyyy, MM, dd, HH, mm, ss] = m;
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
}

/**
 * Returns true when the note's filename-derived date falls within [dateFrom, dateTo] (inclusive).
 * dateFrom / dateTo are "YYYY-MM-DD" strings (date-only comparison).
 */
export function isWithinDateRange(
  filename: string,
  dateFrom: string | undefined,
  dateTo: string | undefined,
): boolean {
  const created = parseCreatedAt(filename);
  if (!created) return false;
  const noteDate = created.slice(0, 10); // "YYYY-MM-DD"
  if (dateFrom && noteDate < dateFrom) return false;
  if (dateTo && noteDate > dateTo) return false;
  return true;
}

/**
 * Format a created_at ISO string for display (e.g. "2026-04-10 09:15").
 */
export function formatCreatedAt(createdAt: string): string {
  // "YYYY-MM-DDTHH:MM:SS" → "YYYY-MM-DD HH:MM"
  return createdAt.replace('T', ' ').slice(0, 16);
}

/**
 * Returns a "YYYY-MM-DD" string for N days ago from today.
 */
export function daysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns today as a "YYYY-MM-DD" string.
 */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}
