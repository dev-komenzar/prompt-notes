// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:shell – Date formatting utilities for IPC contract
// Sprint 3 – Tauri v2 (OQ-005 resolved)
//
// IPC date format: YYYY-MM-DD string
// Rust side parses with chrono::NaiveDate::parse_from_str("%Y-%m-%d")
// Ref: detail:grid_search §4.1

/**
 * Format a Date object to the YYYY-MM-DD string expected by IPC commands.
 * Used by module:grid for from_date/to_date parameters.
 */
export function formatDateForIpc(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DDTHHMMSS filename into a human-readable datetime string.
 * Used for display purposes in grid cards.
 *
 * @param filename e.g. "2026-04-04T143052.md"
 * @returns e.g. "2026-04-04 14:30" or null if parsing fails
 */
export function parseFilenameTimestamp(filename: string): string | null {
  // Strip .md extension and optional _N suffix
  const base = filename.replace(/(_\d+)?\.md$/, '');
  // Expected: YYYY-MM-DDTHHMMSS
  const match = base.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!match) return null;
  const [, datePart, hours, minutes] = match;
  return `${datePart} ${hours}:${minutes}`;
}
