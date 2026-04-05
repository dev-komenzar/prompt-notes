// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 40-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:40 task:40-1 module:grid detail:grid_search
// Date utilities for grid view filter logic. Default 7-day window is computed on the frontend.

/**
 * Format a Date to YYYY-MM-DD string for IPC parameters.
 * Rust side parses this with chrono::NaiveDate::parse_from_str.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the default 7-day filter range (CONV-GRID-1 compliance).
 * from_date = today - 7 days, to_date = today.
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    fromDate: formatDateParam(sevenDaysAgo),
    toDate: formatDateParam(now),
  };
}

/**
 * Format an ISO-like created_at string to a human-readable display.
 * Input: "2026-04-04T14:30:52" → Output: "2026-04-04 14:30"
 */
export function formatDisplayDate(createdAt: string): string {
  if (!createdAt || createdAt.length < 16) {
    return createdAt;
  }
  return createdAt.substring(0, 16).replace('T', ' ');
}

/**
 * Parse a YYYY-MM-DD string to a Date. Returns null on invalid input.
 */
export function parseDateParam(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (isNaN(d.getTime())) return null;
  return d;
}
