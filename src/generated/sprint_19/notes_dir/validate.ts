// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: パストラバーサル防止（フルパス正規化後に `notes_dir` 配下であることを確認）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint:19, task:19-1, deliverable:path-traversal-prevention
// @module: storage/security
// @target: module:storage, platform:linux, platform:macos

/**
 * Filename pattern for notes: YYYY-MM-DDTHHMMSS.md
 * This is the sole valid format; any deviation is rejected.
 */
const NOTES_FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

/**
 * Characters and sequences that indicate path traversal attempts.
 */
const PATH_SEPARATOR_RE = /[/\\]/;
const NULL_BYTE_RE = /\0/;
const RELATIVE_COMPONENT_RE = /(?:^|\/)\.\.(?:\/|$)|(?:^|\/)\.(?:\/|$)/;

export class NotesFilenameValidationError extends Error {
  constructor(
    public readonly filename: string,
    public readonly reason: string,
  ) {
    super(`Invalid notes filename "${filename}": ${reason}`);
    this.name = "NotesFilenameValidationError";
  }
}

/**
 * Validates that a filename is safe to pass to the Rust backend as a notes
 * file identifier.
 *
 * Security guarantees provided by this function (frontend defence-in-depth;
 * the Rust backend performs authoritative validation):
 *  - No path separators (prevents directory traversal via IPC argument).
 *  - No null bytes (prevents null-byte injection).
 *  - No relative path components ("." / "..").
 *  - Matches the canonical YYYY-MM-DDTHHMMSS.md naming scheme exactly.
 *
 * The Rust backend (module:storage) re-validates independently:
 *  - Canonicalises the full path after joining with notes_dir.
 *  - Asserts the canonical path starts with the canonicalised notes_dir.
 *  - Does not follow symbolic links (uses metadata() instead of
 *    symlink_metadata() to detect and reject symlink targets).
 *
 * @throws {NotesFilenameValidationError} when the filename fails any check.
 */
export function validateNotesFilename(filename: string): void {
  if (typeof filename !== "string" || filename.length === 0) {
    throw new NotesFilenameValidationError(
      String(filename),
      "filename must be a non-empty string",
    );
  }

  if (NULL_BYTE_RE.test(filename)) {
    throw new NotesFilenameValidationError(filename, "null byte not allowed");
  }

  if (PATH_SEPARATOR_RE.test(filename)) {
    throw new NotesFilenameValidationError(
      filename,
      "path separator characters are not allowed",
    );
  }

  if (RELATIVE_COMPONENT_RE.test(filename)) {
    throw new NotesFilenameValidationError(
      filename,
      'relative path components ("." / "..") are not allowed',
    );
  }

  if (!NOTES_FILENAME_PATTERN.test(filename)) {
    throw new NotesFilenameValidationError(
      filename,
      'filename must match YYYY-MM-DDTHHMMSS.md (e.g. "2026-04-10T091530.md")',
    );
  }
}

/**
 * Returns true when the filename passes all security checks, false otherwise.
 * Prefer {@link validateNotesFilename} when you need the rejection reason.
 */
export function isValidNotesFilename(filename: unknown): filename is string {
  if (typeof filename !== "string") return false;
  try {
    validateNotesFilename(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Asserts the filename is valid and returns it, narrowing the type.
 * Convenience wrapper for use in IPC call sites.
 */
export function assertValidNotesFilename(filename: string): string {
  validateNotesFilename(filename);
  return filename;
}
