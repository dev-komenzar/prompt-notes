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
// decision: サフィックス方式（_1, _2）を採用。ミリ秒精度タイムスタンプは不採用。
// convention: module:storage — 同一秒内衝突時に _1, _2 サフィックスを付与。

import { MAX_SUFFIX, NOTE_EXTENSION, SUFFIX_SEPARATOR } from './constants';
import { formatTimestamp } from './timestamp-formatter';
import type { CollisionResolutionResult } from './types';

/**
 * Resolves filename collisions using the suffix strategy (OQ-SF-001 decision).
 *
 * Strategy: When YYYY-MM-DDTHHMMSS.md already exists, try
 * YYYY-MM-DDTHHMMSS_1.md, YYYY-MM-DDTHHMMSS_2.md, etc.
 *
 * Design rationale (OQ-SF-001):
 *   - Suffix approach chosen over millisecond precision because:
 *     1. Preserves the human-readable second-level granularity
 *     2. Collision within the same second is rare in normal usage
 *        (user pressing Cmd+N repeatedly)
 *     3. Suffix makes the collision explicit rather than hidden
 *        in sub-second digits
 *     4. Regex validation remains simple and predictable
 *     5. Filesystem sort order is preserved (suffixed files sort
 *        adjacent to their base timestamp)
 *
 * @param existingFilenames - Set or array of filenames already present in notes_dir
 * @param date - The creation timestamp (defaults to now)
 * @returns Resolution result with the non-colliding filename
 * @throws RangeError if MAX_SUFFIX is exceeded (indicates systemic issue)
 */
export function resolveCollision(
  existingFilenames: ReadonlySet<string> | readonly string[],
  date: Date = new Date(),
): CollisionResolutionResult {
  const existingSet =
    existingFilenames instanceof Set
      ? existingFilenames
      : new Set(existingFilenames);

  const baseTimestamp = formatTimestamp(date);
  const baseFilename = `${baseTimestamp}${NOTE_EXTENSION}`;

  if (!existingSet.has(baseFilename)) {
    return {
      filename: baseFilename,
      suffixApplied: false,
      suffix: null,
    };
  }

  for (let i = 1; i <= MAX_SUFFIX; i++) {
    const candidate = `${baseTimestamp}${SUFFIX_SEPARATOR}${i}${NOTE_EXTENSION}`;
    if (!existingSet.has(candidate)) {
      return {
        filename: candidate,
        suffixApplied: true,
        suffix: i,
      };
    }
  }

  throw new RangeError(
    `Filename collision resolution exceeded MAX_SUFFIX (${MAX_SUFFIX}) ` +
      `for timestamp ${baseTimestamp}. This indicates a systemic issue.`,
  );
}

/**
 * Finds the next available suffix for a given base timestamp.
 * Returns 0 if the base filename is available (no suffix needed).
 *
 * Useful for diagnostics and testing.
 *
 * @param baseTimestamp - e.g. "2026-04-04T143052"
 * @param existingFilenames - Set or array of existing filenames
 * @returns The suffix number to use (0 = no suffix needed)
 */
export function findNextAvailableSuffix(
  baseTimestamp: string,
  existingFilenames: ReadonlySet<string> | readonly string[],
): number {
  const existingSet =
    existingFilenames instanceof Set
      ? existingFilenames
      : new Set(existingFilenames);

  const baseFilename = `${baseTimestamp}${NOTE_EXTENSION}`;
  if (!existingSet.has(baseFilename)) {
    return 0;
  }

  for (let i = 1; i <= MAX_SUFFIX; i++) {
    const candidate = `${baseTimestamp}${SUFFIX_SEPARATOR}${i}${NOTE_EXTENSION}`;
    if (!existingSet.has(candidate)) {
      return i;
    }
  }

  throw new RangeError(
    `No available suffix found within MAX_SUFFIX (${MAX_SUFFIX}) for: ${baseTimestamp}`,
  );
}

/**
 * Lists all filenames that share the same base timestamp
 * (i.e., were created in the same second).
 *
 * @param baseTimestamp - e.g. "2026-04-04T143052"
 * @param existingFilenames - All filenames to search through
 * @returns Array of filenames sharing the timestamp, sorted by suffix
 */
export function findSameSecondFilenames(
  baseTimestamp: string,
  existingFilenames: readonly string[],
): string[] {
  const baseFilename = `${baseTimestamp}${NOTE_EXTENSION}`;
  const prefix = `${baseTimestamp}${SUFFIX_SEPARATOR}`;

  return existingFilenames
    .filter((f) => f === baseFilename || f.startsWith(prefix))
    .sort((a, b) => {
      const suffixA = extractSuffixNumber(a);
      const suffixB = extractSuffixNumber(b);
      return suffixA - suffixB;
    });
}

function extractSuffixNumber(filename: string): number {
  const match = filename.match(/_(\d+)\.md$/);
  return match ? parseInt(match[1], 10) : 0;
}
