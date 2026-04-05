// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage,settings]

import { DEFAULT_FILTER_DAYS } from './constants';

/**
 * Formats a Date object to YYYY-MM-DD string for IPC date parameters.
 * Rust backend parses this format with chrono::NaiveDate::parse_from_str.
 */
export function formatDateForIpc(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes the default date range for the grid view's initial filter.
 * Returns from_date (N days ago) and to_date (today) as YYYY-MM-DD strings.
 *
 * Grid view mounts with this range and passes it to list_notes IPC command.
 * The number of days defaults to DEFAULT_FILTER_DAYS (7).
 */
export function getDefaultDateRange(days: number = DEFAULT_FILTER_DAYS): DateRange {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - days);

  return {
    from_date: formatDateForIpc(from),
    to_date: formatDateForIpc(now),
  };
}

/**
 * Parses a note filename timestamp into a human-readable display string.
 * Input format: YYYY-MM-DDTHHMMSS (from filename without .md extension)
 * Output format: YYYY-MM-DD HH:MM (for card display in grid view)
 *
 * Returns null if the filename does not match the expected pattern.
 * Actual timestamp parsing authority belongs to Rust backend (chrono);
 * this function is for UI display purposes only.
 */
export function formatCreatedAtForDisplay(createdAt: string): string | null {
  // created_at from Rust is in format "YYYY-MM-DDTHH:MM:SS" or similar ISO-ish
  if (!createdAt || createdAt.length < 16) {
    return null;
  }
  // Handle both "2026-04-04T14:30:52" and "2026-04-04T143052" formats
  const normalized = createdAt.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):?(\d{2}):?(\d{2})$/,
    '$1 $2:$3',
  );
  if (normalized === createdAt && !createdAt.includes(' ')) {
    // Fallback: try parsing YYYY-MM-DDTHHMMSS format
    const match = createdAt.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})$/);
    if (match) {
      return `${match[1]} ${match[2]}:${match[3]}`;
    }
    return null;
  }
  return normalized;
}

/**
 * Checks whether a given date string (YYYY-MM-DD) falls within a date range (inclusive).
 * Used for client-side validation hints only; actual filtering is performed by Rust backend.
 */
export function isDateInRange(
  dateStr: string,
  fromDate: string,
  toDate: string,
): boolean {
  return dateStr >= fromDate && dateStr <= toDate;
}

export interface DateRange {
  readonly from_date: string;
  readonly to_date: string;
}
