// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:grid_search
// Date formatting utilities for IPC filter parameters.
// The Rust backend expects "YYYY-MM-DD" strings for from_date / to_date.

/**
 * Format a Date object to "YYYY-MM-DD" for IPC filter params.
 * Uses local date components (not UTC) to match the Rust-side
 * chrono::Local interpretation.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day filter range for GridView (CONV-GRID-1).
 * Returns { fromDate, toDate } as "YYYY-MM-DD" strings.
 */
export function defaultGridDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    fromDate: formatDateParam(sevenDaysAgo),
    toDate: formatDateParam(now),
  };
}

/**
 * Parse a PromptNotes filename into a human-readable datetime string.
 * Input:  "2026-04-04T143052.md" or "2026-04-04T143052_1.md"
 * Output: "2026-04-04 14:30:52" (or null on parse failure)
 */
export function filenameToDisplayDate(filename: string): string | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(?:_\d+)?\.md$/,
  );
  if (!match) return null;
  const [, year, month, day, hour, min, sec] = match;
  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
}
