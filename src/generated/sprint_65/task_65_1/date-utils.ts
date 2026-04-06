// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=grid
// Date calculation and formatting utilities for module:grid.
// Default 7-day filter date range is computed on the frontend (Svelte side).
// Rust backend receives from_date/to_date as YYYY-MM-DD strings.

/**
 * Formats a Date object as "YYYY-MM-DD" string for IPC communication.
 * Rust side parses this with chrono::NaiveDate::parse_from_str.
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns the default 7-day filter range for the grid view (CONV-GRID-1).
 * from_date = today - 7 days, to_date = today.
 */
export function getDefault7DayRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  return {
    from_date: formatDateISO(sevenDaysAgo),
    to_date: formatDateISO(now),
  };
}

/**
 * Formats a created_at string (from NoteEntry) for human-readable card display.
 * Input: "2026-04-04T14:30:52" → Output: "2026-04-04 14:30"
 */
export function formatDisplayDate(createdAt: string): string {
  // created_at format from Rust: "YYYY-MM-DDTHH:MM:SS"
  if (createdAt.length >= 16) {
    return createdAt.slice(0, 10) + " " + createdAt.slice(11, 16);
  }
  return createdAt;
}

/**
 * Parses a filename timestamp into a Date object.
 * Filename format: YYYY-MM-DDTHHMMSS.md
 * Example: "2026-04-04T143052.md" → Date(2026, 3, 4, 14, 30, 52)
 */
export function parseFilenameTimestamp(filename: string): Date | null {
  // Strip .md extension and optional suffix like _1
  const base = filename.replace(/\.md$/, "").replace(/_\d+$/, "");
  // Expected: YYYY-MM-DDTHHMMSS (17 chars)
  const match = base.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1,
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10),
  );
}
