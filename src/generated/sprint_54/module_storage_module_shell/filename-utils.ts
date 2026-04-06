// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: `module:storage`, `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=54, task=54-1, modules=storage, node=detail:storage_fileformat
// Filename parsing utilities for the YYYY-MM-DDTHHMMSS.md format.
// Convention 9: Filename is YYYY-MM-DDTHHMMSS.md, immutable after creation.
// Convention 10: created_at is derived from filename, not from frontmatter.

/**
 * Parses a PromptNotes filename into a Date object.
 * Filename format: YYYY-MM-DDTHHMMSS.md (e.g. "2026-04-04T143052.md")
 *
 * @returns Date object or null if parsing fails
 */
export function parseDateFromFilename(filename: string): Date | null {
  // Strip .md extension and optional collision suffix
  const base = filename.replace(/(_\d+)?\.md$/, '');
  // Expected: "YYYY-MM-DDTHHMMSS"
  const match = base.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // JS months are 0-indexed
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  );

  // Validate the date is real (e.g., reject month=13)
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Formats a Date to the ISO-8601-ish string used in NoteEntry.created_at.
 * Output: "YYYY-MM-DDTHH:MM:SS"
 */
export function formatCreatedAt(date: Date): string {
  const y = date.getFullYear().toString().padStart(4, '0');
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const mi = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

/**
 * Formats a Date to YYYY-MM-DD for use as IPC filter parameter.
 */
export function formatDateFilter(date: Date): string {
  const y = date.getFullYear().toString().padStart(4, '0');
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/**
 * Computes the default 7-day filter window for the grid view.
 * Returns { from_date, to_date } in YYYY-MM-DD format.
 */
export function getDefault7DayWindow(): { from_date: string; to_date: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    from_date: formatDateFilter(sevenDaysAgo),
    to_date: formatDateFilter(now),
  };
}

/**
 * Formats a created_at string for human-readable display in grid cards.
 * Input: "2026-04-04T14:30:52"
 * Output: "2026-04-04 14:30"
 */
export function formatDisplayDate(createdAt: string): string {
  // Strip seconds for display
  return createdAt.replace('T', ' ').replace(/:\d{2}$/, '');
}
