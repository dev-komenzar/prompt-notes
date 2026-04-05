// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:4 task:4-1 module:shell file:filename-validator.ts
// Client-side filename validation mirroring Rust-side regex guard.
// Prevents path traversal and enforces YYYY-MM-DDTHHMMSS.md naming convention.

/**
 * Regex matching the canonical PromptNotes filename format.
 * Optional _N suffix handles same-second collision avoidance.
 * Pattern: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md
 */
const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/**
 * Characters that indicate path traversal or absolute path attempts.
 */
const FORBIDDEN_SEQUENCES = ['..', '/', '\\'] as const;

/**
 * Validate that a filename conforms to the PromptNotes naming convention
 * and does not contain path traversal sequences.
 *
 * This is a client-side fast-fail check. The Rust backend performs
 * canonical validation independently — this does NOT replace server-side checks.
 *
 * @returns true if valid
 */
export function isValidFilename(filename: string): boolean {
  if (typeof filename !== 'string' || filename.length === 0) {
    return false;
  }

  for (const seq of FORBIDDEN_SEQUENCES) {
    if (filename.includes(seq)) {
      return false;
    }
  }

  return FILENAME_PATTERN.test(filename);
}

/**
 * Assert filename validity. Throws if the filename does not match
 * the expected pattern, preventing malformed IPC calls.
 *
 * @throws FilenameValidationError
 */
export function assertValidFilename(filename: string): void {
  if (!isValidFilename(filename)) {
    throw new FilenameValidationError(filename);
  }
}

/**
 * Error thrown when a filename fails client-side validation.
 */
export class FilenameValidationError extends Error {
  public readonly filename: string;

  constructor(filename: string) {
    super(
      `Invalid filename "${filename}". ` +
        'Expected pattern: YYYY-MM-DDTHHMMSS.md (e.g. 2026-04-04T143052.md). ' +
        'Path traversal sequences (.., /, \\) are forbidden.',
    );
    this.name = 'FilenameValidationError';
    this.filename = filename;
  }
}
