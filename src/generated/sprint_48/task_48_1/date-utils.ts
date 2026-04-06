// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=date-utils
// Date formatting utilities for grid view filters and display.
// Dates are exchanged with the Rust backend as "YYYY-MM-DD" strings.

/**
 * Format a Date object to "YYYY-MM-DD" string for IPC filter parameters.
 * Uses local timezone to match Rust-side chrono::Local behaviour.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter window (CONV-GRID-1).
 *
 * @returns `{ fromDate, toDate }` formatted as "YYYY-MM-DD" strings
 *          representing [today − 7 days, today].
 */
export function defaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    fromDate: formatDateParam(sevenDaysAgo),
    toDate: formatDateParam(now),
  };
}

/**
 * Format a created_at string (from NoteEntry) for human-readable card display.
 * Input: "2026-04-04T14:30:52" → Output: "2026-04-04 14:30"
 *
 * If parsing fails, returns the raw input unchanged.
 */
export function formatCreatedAtDisplay(createdAt: string): string {
  // created_at from Rust is "YYYY-MM-DDTHH:MM:SS" (no timezone suffix).
  const match = createdAt.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):\d{2}$/,
  );
  if (match) {
    return `${match[1]} ${match[2]}:${match[3]}`;
  }
  return createdAt;
}

/**
 * Parse a PromptNotes filename into a Date object.
 * Filename pattern: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md
 *
 * @returns Date in local timezone, or null if the filename doesn't match.
 */
export function parseFilenameDate(filename: string): Date | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(_\d+)?\.md$/,
  );
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
}
