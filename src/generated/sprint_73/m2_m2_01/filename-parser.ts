// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 73-1
// @task-title: M2（M2-01）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// tracer: sprint_73/m2_m2_01 | OQ-SF-001 | suffix-based collision resolution
// convention: module:storage — ファイル名からタイムスタンプ・サフィックスをパース。created_at導出。

import { FILENAME_REGEX } from './constants';
import type { ParsedFilename } from './types';
import { FilenameParseError } from './types';
import { validateFilename } from './filename-validator';

/**
 * Parses a PromptNotes filename into its constituent components.
 *
 * Handles both base filenames and collision-suffixed filenames:
 *   "2026-04-04T143052.md"   → suffix: null
 *   "2026-04-04T143052_1.md" → suffix: 1
 *
 * Derives ISO 8601 created_at from the filename timestamp,
 * consistent with the convention that creation date is obtained
 * from filename, not from frontmatter.
 *
 * @param filename - A valid PromptNotes filename
 * @returns Parsed filename components
 * @throws FilenameParseError if the filename cannot be parsed
 */
export function parseFilename(filename: string): ParsedFilename {
  try {
    validateFilename(filename);
  } catch (e) {
    throw new FilenameParseError(
      filename,
      `Cannot parse invalid filename: ${(e as Error).message}`,
    );
  }

  const match = filename.match(FILENAME_REGEX);
  if (!match) {
    throw new FilenameParseError(filename, `Regex match failed for: "${filename}"`);
  }

  const datePart = match[1];
  const timePart = match[2];
  const suffixStr = match[3];

  const suffix = suffixStr !== undefined ? parseInt(suffixStr, 10) : null;
  const baseTimestamp = `${datePart}T${timePart}`;

  const hours = timePart.substring(0, 2);
  const minutes = timePart.substring(2, 4);
  const seconds = timePart.substring(4, 6);
  const createdAt = `${datePart}T${hours}:${minutes}:${seconds}`;

  return {
    filename,
    datePart,
    timePart,
    suffix,
    createdAt,
    baseTimestamp,
  };
}

/**
 * Extracts the base timestamp (without suffix) from a filename.
 * Useful for grouping filenames that share the same creation second.
 *
 * @param filename - A valid PromptNotes filename
 * @returns Base timestamp string, e.g. "2026-04-04T143052"
 */
export function extractBaseTimestamp(filename: string): string {
  return parseFilename(filename).baseTimestamp;
}

/**
 * Derives ISO 8601 datetime from a PromptNotes filename.
 * This is the canonical way to obtain created_at on the frontend,
 * matching the Rust backend's NoteEntry.created_at derivation.
 *
 * @param filename - A valid PromptNotes filename
 * @returns ISO 8601 datetime string, e.g. "2026-04-04T14:30:52"
 */
export function deriveCreatedAt(filename: string): string {
  return parseFilename(filename).createdAt;
}
