// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:date-utils.ts
// Date formatting utilities for IPC date parameters.
// Used by module:grid for default 7-day filter computation.

/**
 * Format a Date as YYYY-MM-DD string for IPC date filter parameters.
 * Rust side parses this with chrono::NaiveDate::parse_from_str("%Y-%m-%d").
 */
export function formatDateForIpc(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter window used by module:grid on mount.
 * Returns { from_date, to_date } in YYYY-MM-DD format.
 *
 * The 7-day default is computed on the frontend (Svelte side);
 * the Rust backend does not impose default date ranges.
 */
export function defaultDateRange(): {
  from_date: string;
  to_date: string;
} {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    from_date: formatDateForIpc(sevenDaysAgo),
    to_date: formatDateForIpc(now),
  };
}

/**
 * Parse a PromptNotes filename timestamp into a human-readable local string.
 * Input:  "2026-04-04T143052" or "2026-04-04T143052.md"
 * Output: "2026-04-04 14:30:52" (or similar locale representation)
 */
export function filenameTimestampToDisplay(filename: string): string {
  const base = filename.replace(/(_\d+)?\.md$/, '');
  const match = base.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})$/,
  );
  if (!match) return filename;

  const [, year, month, day, hour, min, sec] = match;
  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
}
