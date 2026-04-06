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

// CoDD Traceability: sprint=65, task=65-1, module=storage
// Client-side filename validation mirror.
// Authoritative validation is performed by module:storage (Rust/regex).
// This module provides pre-flight checks to avoid unnecessary IPC round-trips.

/**
 * Regex pattern matching valid note filenames.
 * Format: YYYY-MM-DDTHHMMSS.md with optional _N suffix for collision avoidance.
 * Matches: "2026-04-04T143052.md", "2026-04-04T143052_1.md"
 * Rejects: "../etc/passwd", "notes.txt", absolute paths
 */
const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Validates that a filename conforms to the YYYY-MM-DDTHHMMSS.md pattern.
 * This is a client-side pre-check; Rust backend performs the authoritative validation.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Asserts filename validity, throwing if invalid.
 * Used as a guard before constructing IPC call arguments.
 */
export function assertValidNoteFilename(filename: string): void {
  if (!isValidNoteFilename(filename)) {
    throw new Error(
      `Invalid note filename: "${filename}". Expected format: YYYY-MM-DDTHHMMSS.md`,
    );
  }
}
