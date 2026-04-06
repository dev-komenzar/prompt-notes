// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: detail:grid_search §4.1
// Date utilities for module:grid default 7-day filter calculation.
// These run on the Svelte (frontend) side. Rust side receives date strings and filters.

/**
 * Format a Date to YYYY-MM-DD string for IPC list_notes/search_notes args.
 * Rust side parses this with chrono::NaiveDate::parse_from_str("%Y-%m-%d").
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate the default 7-day filter range for grid view initial load.
 * Per CONV-GRID-1: default filter is 直近7日間 (last 7 days).
 *
 * @returns { fromDate, toDate } as YYYY-MM-DD strings
 */
export function defaultSevenDayRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    fromDate: formatDateParam(sevenDaysAgo),
    toDate: formatDateParam(now),
  };
}

/**
 * Parse a created_at string (from NoteEntry, derived from filename) into a Date.
 * Format: "YYYY-MM-DDTHH:MM:SS" (ISO-like, from Rust-side filename parsing).
 */
export function parseCreatedAt(createdAt: string): Date {
  return new Date(createdAt);
}

/**
 * Format created_at for human-readable display on NoteCard.
 * e.g. "2026-04-04 14:30"
 */
export function formatCreatedAtDisplay(createdAt: string): string {
  const d = parseCreatedAt(createdAt);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${da} ${h}:${mi}`;
}
