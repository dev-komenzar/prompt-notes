// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-2
// @task-title: シンボリックリンク非追跡
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import * as fs from "fs";
import * as path from "path";
import {
  assertValidNotesFilename,
  NotesFilenameValidationError,
} from "@/generated/sprint_19/notes_dir/index";

export class SymlinkDetectedError extends Error {
  constructor(public readonly resolvedPath: string) {
    super(`Symlink detected and rejected: ${resolvedPath}`);
    this.name = "SymlinkDetectedError";
  }
}

export class PathEscapeError extends Error {
  constructor(
    public readonly resolvedPath: string,
    public readonly notesDir: string
  ) {
    super(
      `Path ${resolvedPath} is outside notes directory ${notesDir}`
    );
    this.name = "PathEscapeError";
  }
}

/**
 * Checks whether a path entry is a symlink using lstat (does not follow symlinks).
 * Returns true if the path is a symlink.
 */
export function isSymlink(targetPath: string): boolean {
  try {
    const stat = fs.lstatSync(targetPath);
    return stat.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Validates that a resolved path:
 * 1. Does not contain symlinks at any path component within notesDir.
 * 2. Is actually located under notesDir after normalization.
 *
 * Throws SymlinkDetectedError or PathEscapeError on violation.
 */
export function assertNoSymlink(resolvedPath: string, notesDir: string): void {
  const normalizedNotesDir = path.resolve(notesDir);
  const normalizedTarget = path.resolve(resolvedPath);

  if (!normalizedTarget.startsWith(normalizedNotesDir + path.sep) &&
      normalizedTarget !== normalizedNotesDir) {
    throw new PathEscapeError(normalizedTarget, normalizedNotesDir);
  }

  // Walk each component from notesDir down to target, checking for symlinks.
  const relative = path.relative(normalizedNotesDir, normalizedTarget);
  const parts = relative.split(path.sep);
  let current = normalizedNotesDir;

  for (const part of parts) {
    current = path.join(current, part);
    if (isSymlink(current)) {
      throw new SymlinkDetectedError(current);
    }
  }
}

/**
 * Builds the full path for a notes filename, then validates:
 * 1. Filename conforms to YYYY-MM-DDTHHMMSS.md format (via task 19-1).
 * 2. The resulting path is inside notesDir (path traversal prevention).
 * 3. No symlinks exist along the path components (symlink non-following).
 *
 * Returns the safe, normalized absolute path on success.
 * Throws NotesFilenameValidationError, PathEscapeError, or SymlinkDetectedError on failure.
 */
export function resolveSecureNotesPath(
  filename: string,
  notesDir: string
): string {
  // Step 1: Validate filename format (delegates to task 19-1).
  assertValidNotesFilename(filename);

  // Step 2: Build candidate path and normalize without following symlinks.
  const normalizedNotesDir = path.resolve(notesDir);
  const candidate = path.join(normalizedNotesDir, filename);
  const normalized = path.normalize(candidate);

  // Step 3: Confirm the normalized path stays within notesDir.
  if (
    !normalized.startsWith(normalizedNotesDir + path.sep) &&
    normalized !== normalizedNotesDir
  ) {
    throw new PathEscapeError(normalized, normalizedNotesDir);
  }

  // Step 4: Reject symlinks along the path.
  assertNoSymlink(normalized, normalizedNotesDir);

  return normalized;
}

/**
 * Safe predicate version of resolveSecureNotesPath.
 * Returns the resolved path string, or null if any security check fails.
 */
export function tryResolveSecureNotesPath(
  filename: string,
  notesDir: string
): string | null {
  try {
    return resolveSecureNotesPath(filename, notesDir);
  } catch {
    return null;
  }
}
