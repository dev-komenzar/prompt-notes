// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Filename utilities
// Filename format: YYYY-MM-DDTHHMMSS.md (immutable after creation)
// Collision suffix: _1, _2, etc. for same-second creation
// Filename generation is exclusive to Rust backend (chrono crate).
// TypeScript side validates and parses filenames received via IPC.

/**
 * Strict regex for note filenames.
 * Matches: 2026-04-04T143052.md, 2026-04-04T143052_1.md
 * Rejects path traversal attempts and non-conforming names.
 */
const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/** Validates that a string conforms to the YYYY-MM-DDTHHMMSS[_N].md format. */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Parses the creation timestamp from a note filename into a Date object.
 * Returns null if the filename is invalid.
 */
export function parseCreatedAt(filename: string): Date | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(_\d+)?\.md$/,
  );
  if (!match) {
    return null;
  }

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
 * Parses the creation timestamp from a note filename into an ISO 8601 string.
 * Example: "2026-04-04T143052.md" → "2026-04-04T14:30:52"
 * Returns null if the filename is invalid.
 */
export function parseCreatedAtISO(filename: string): string | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(_\d+)?\.md$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Formats a Date as YYYY-MM-DD for use as from_date / to_date IPC parameters.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns YYYY-MM-DD string for 7 days ago (default grid filter start).
 */
export function getDefaultFromDate(): string {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return formatDateParam(sevenDaysAgo);
}

/**
 * Returns YYYY-MM-DD string for today (default grid filter end).
 */
export function getDefaultToDate(): string {
  return formatDateParam(new Date());
}

/**
 * Formats a created_at ISO string for human-readable display.
 * Example: "2026-04-04T14:30:52" → "2026-04-04 14:30"
 */
export function formatCreatedAtDisplay(createdAt: string): string {
  return createdAt.replace('T', ' ').slice(0, 16);
}
