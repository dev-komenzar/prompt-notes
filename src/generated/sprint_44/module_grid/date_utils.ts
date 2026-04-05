// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:grid_search §4.1

import { DEFAULT_FILTER_DAYS } from './constants';

/**
 * Format a Date to the YYYY-MM-DD string expected by the Rust backend
 * for the from_date / to_date IPC parameters.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter range.
 *
 * CONV-GRID-1: Default filter is the last 7 days.
 * The range is computed on the Svelte (frontend) side;
 * the Rust backend does not own default-value logic.
 *
 * @returns { fromDate, toDate } both as YYYY-MM-DD strings.
 */
export function getDefault7DayRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - DEFAULT_FILTER_DAYS);

  return {
    fromDate: formatDateParam(sevenDaysAgo),
    toDate: formatDateParam(now),
  };
}

/**
 * Parse the created_at ISO-ish string returned by module:storage
 * into a human-readable display string for NoteCard.
 *
 * Input format example: "2026-04-04T14:30:52"
 * Output format example: "2026-04-04 14:30"
 */
export function formatCreatedAtDisplay(createdAt: string): string {
  // Trim seconds portion if present for compact card display.
  const withoutSeconds = createdAt.replace(/:\d{2}$/, '');
  // Normalise the T separator to a space.
  return withoutSeconds.replace('T', ' ');
}

/**
 * Validate that a date-param string conforms to YYYY-MM-DD.
 * Used defensively before sending parameters to IPC.
 */
export function isValidDateParam(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
