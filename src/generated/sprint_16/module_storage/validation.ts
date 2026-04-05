// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 16-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 16 — Task 16-1 — module:storage
// CoDD traceability: detail:storage_fileformat §1.1, §4.7
// Filename validation enforced on frontend as defense-in-depth.
// Rust backend performs authoritative validation; this is an early-reject guard.

/**
 * Regex matching the canonical PromptNotes filename format.
 * Pattern: YYYY-MM-DDTHHMMSS.md with optional _N collision suffix.
 * Rejects path traversal characters (/, \, ..) by construction.
 */
const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Validates that a filename conforms to the PromptNotes naming convention.
 * Returns true only for filenames matching `YYYY-MM-DDTHHMMSS.md` or
 * `YYYY-MM-DDTHHMMSS_N.md` (collision suffix).
 *
 * This is a client-side defense-in-depth check. The Rust backend
 * performs authoritative validation and will reject non-conforming
 * filenames regardless of this check.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Asserts that a filename is valid; throws StorageValidationError if not.
 */
export function assertValidNoteFilename(filename: string): void {
  if (!isValidNoteFilename(filename)) {
    throw new StorageValidationError(
      `Invalid note filename: "${filename}". ` +
        `Expected format: YYYY-MM-DDTHHMMSS.md (e.g. 2026-04-04T143052.md)`
    );
  }
}

/**
 * Validation error thrown when a filename does not conform to the
 * PromptNotes naming convention. This prevents obviously malformed
 * filenames from reaching the IPC boundary.
 */
export class StorageValidationError extends Error {
  override readonly name = "StorageValidationError" as const;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, StorageValidationError.prototype);
  }
}
