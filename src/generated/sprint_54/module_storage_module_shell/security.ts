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

// CoDD Trace: sprint=54, task=54-1, modules=storage+shell, node=detail:storage_fileformat,detail:component_architecture
// Client-side security validators for IPC boundary.
// These are DEFENSE-IN-DEPTH measures. The Rust backend performs authoritative validation.
// Convention: All file operations go through Rust backend (CONV-1).
// Convention: No frontend filesystem access (CONV-1, CONV-2).

import { FilenameValidationError, PathValidationError } from './errors';

/**
 * Strict filename pattern: YYYY-MM-DDTHHMMSS.md with optional collision suffix _N
 * Matches Rust-side regex: ^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$
 */
const FILENAME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/;

/** Characters that indicate path traversal attempts */
const PATH_TRAVERSAL_CHARS = ['..', '/', '\\', '\0'];

/**
 * Validates a note filename against the canonical pattern.
 * Rejects path traversal, absolute paths, and non-conforming names.
 *
 * This is a client-side guard. Rust backend performs authoritative validation.
 *
 * @throws FilenameValidationError if the filename is invalid
 */
export function assertValidFilename(filename: string): void {
  if (!filename || typeof filename !== 'string') {
    throw new FilenameValidationError(String(filename));
  }

  // Reject path traversal characters
  for (const dangerous of PATH_TRAVERSAL_CHARS) {
    if (filename.includes(dangerous)) {
      throw new FilenameValidationError(filename);
    }
  }

  // Enforce canonical pattern
  if (!FILENAME_PATTERN.test(filename)) {
    throw new FilenameValidationError(filename);
  }
}

/**
 * Tests whether a filename matches the canonical pattern without throwing.
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') return false;
  for (const dangerous of PATH_TRAVERSAL_CHARS) {
    if (filename.includes(dangerous)) return false;
  }
  return FILENAME_PATTERN.test(filename);
}

/**
 * Validates a directory path for the set_config command.
 * Rejects obviously malicious or empty paths.
 * Authoritative path validation (existence, permissions) is done by Rust backend.
 *
 * @throws PathValidationError if the path is invalid
 */
export function assertValidDirectoryPath(path: string): void {
  if (!path || typeof path !== 'string') {
    throw new PathValidationError(String(path), 'Path must be a non-empty string');
  }

  if (path.trim().length === 0) {
    throw new PathValidationError(path, 'Path must not be blank');
  }

  // Reject null bytes (common injection vector)
  if (path.includes('\0')) {
    throw new PathValidationError(path, 'Path must not contain null bytes');
  }

  // Path must be absolute (starts with / on Linux/macOS)
  if (!path.startsWith('/') && !path.startsWith('~')) {
    throw new PathValidationError(path, 'Path must be absolute (start with / or ~)');
  }
}

/**
 * Validates a date string used for list_notes / search_notes filtering.
 * Expected format: YYYY-MM-DD
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function assertValidDateFilter(date: string): void {
  if (!DATE_PATTERN.test(date)) {
    throw new Error(`Invalid date filter format: "${date}". Expected YYYY-MM-DD.`);
  }
}

/**
 * Sanitizes a search query string. Removes null bytes and trims whitespace.
 * Does NOT reject any input — search queries are free-form text.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  return query.replace(/\0/g, '').trim();
}
