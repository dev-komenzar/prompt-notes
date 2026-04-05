// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage]
// Client-side filename validation mirroring the Rust-side regex.
// Rust performs authoritative validation; this is a fast-fail guard for the frontend.

/**
 * Canonical filename pattern for PromptNotes .md files.
 * Format: YYYY-MM-DDTHHMMSS.md  with optional _N collision suffix.
 * Matches: "2026-04-04T143052.md", "2026-04-04T143052_1.md"
 * Rejects: "../etc/passwd", "notes.txt", absolute paths, path traversal
 */
export const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Validate that a filename conforms to the YYYY-MM-DDTHHMMSS[_N].md pattern.
 * Returns true if valid.
 *
 * NOTE: This is a client-side convenience check only.
 * The Rust backend performs the authoritative validation and will reject
 * any filename that does not match, preventing path traversal.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Extract created_at datetime string from a valid filename.
 * "2026-04-04T143052.md" → "2026-04-04T14:30:52"
 * Returns null if the filename does not match the pattern.
 */
export function parseCreatedAtFromFilename(
  filename: string,
): string | null {
  if (!FILENAME_PATTERN.test(filename)) {
    return null;
  }
  // Strip .md and optional _N suffix
  const stem = filename.replace(/(_\d+)?\.md$/, '');
  // stem = "2026-04-04T143052"
  if (stem.length !== 17) {
    return null;
  }
  const datePart = stem.substring(0, 10); // "2026-04-04"
  const timePart = stem.substring(11, 17); // "143052"
  const hours = timePart.substring(0, 2);
  const minutes = timePart.substring(2, 4);
  const seconds = timePart.substring(4, 6);
  return `${datePart}T${hours}:${minutes}:${seconds}`;
}
