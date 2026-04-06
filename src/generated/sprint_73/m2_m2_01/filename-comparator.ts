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
// convention: module:storage — ソートロジック。created_at降順（新しい順）。

import { parseFilename } from './filename-parser';
import { isValidFilename } from './filename-validator';

/**
 * Compares two PromptNotes filenames for sorting.
 * Primary sort: by base timestamp (chronological).
 * Secondary sort: by suffix number (for same-second filenames).
 *
 * This mirrors the Rust backend's NoteEntry[] sort order
 * (created_at descending) but returns standard comparator values
 * for use with Array.prototype.sort().
 *
 * @returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareFilenames(a: string, b: string): number {
  const parsedA = parseFilename(a);
  const parsedB = parseFilename(b);

  const tsCompare = parsedA.baseTimestamp.localeCompare(parsedB.baseTimestamp);
  if (tsCompare !== 0) {
    return tsCompare;
  }

  const suffixA = parsedA.suffix ?? 0;
  const suffixB = parsedB.suffix ?? 0;
  return suffixA - suffixB;
}

/**
 * Sorts filenames in descending order (newest first).
 * Matches the Rust backend's NoteEntry[] response ordering.
 *
 * @param filenames - Array of filename strings
 * @returns New array sorted newest-first
 */
export function sortFilenamesDescending(filenames: readonly string[]): string[] {
  return [...filenames]
    .filter(isValidFilename)
    .sort((a, b) => -compareFilenames(a, b));
}

/**
 * Sorts filenames in ascending order (oldest first).
 *
 * @param filenames - Array of filename strings
 * @returns New array sorted oldest-first
 */
export function sortFilenamesAscending(filenames: readonly string[]): string[] {
  return [...filenames]
    .filter(isValidFilename)
    .sort(compareFilenames);
}
