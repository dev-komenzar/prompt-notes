// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Filename validation and date formatting utilities
// Canonical validation is Rust-side (regex crate). These are client-side
// mirrors for early rejection and UI display purposes only.
// Sprint 15 · M2-03 · read_note IPC コマンド実装

/**
 * Pattern for valid note filenames: YYYY-MM-DDTHHMMSS.md
 * with optional _N suffix for same-second collision avoidance.
 */
const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Extraction pattern for timestamp components from a filename.
 */
const TIMESTAMP_EXTRACT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})/;

/**
 * Validate that a filename conforms to the YYYY-MM-DDTHHMMSS.md convention.
 * This is a client-side check; Rust performs authoritative validation.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Parse the creation timestamp from a note filename.
 * Returns null if the filename does not match the expected pattern.
 *
 * The returned Date is in local time, matching chrono::Local::now() on the
 * Rust side.
 */
export function parseCreatedAtFromFilename(filename: string): Date | null {
  const match = filename.match(TIMESTAMP_EXTRACT);
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

/**
 * Format a Date as YYYY-MM-DD string for list_notes / search_notes
 * from_date / to_date parameters.
 *
 * Rust-side parses this with chrono::NaiveDate::parse_from_str.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the default 7-day date range for the grid view.
 * The grid view (module:grid) calls this on mount; Rust backend has
 * no concept of a "default" date range.
 */
export function getDefaultDateRange(): {
  from_date: string;
  to_date: string;
} {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return {
    from_date: formatDateParam(sevenDaysAgo),
    to_date: formatDateParam(now),
  };
}

/**
 * Format a created_at string (from NoteEntry) into a human-readable
 * display string for card rendering.
 *
 * Input:  "2026-04-04T14:30:52"
 * Output: "2026-04-04 14:30"
 */
export function formatCreatedAtForDisplay(createdAt: string): string {
  // Trim seconds for concise card display
  const match = createdAt.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/,
  );
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  // Fallback: return as-is
  return createdAt;
}
