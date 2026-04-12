// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 8-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 8 / task: 8-1 / module: storage
// generate_filename() — YYYY-MM-DDTHHMMSS.md format, collision-safe

import { NOTE_ID_PATTERN } from './types';

/**
 * Formats a Date as "YYYY-MM-DDTHHMMSS" (no colon in time, T separator).
 * This is the canonical note ID / filename stem format.
 */
export function formatNoteId(date: Date): string {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  return `${year}-${month}-${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generates the filename (with .md extension) from a Date.
 * Uses local time, consistent with the design spec.
 */
export function generateFilename(date: Date = new Date()): string {
  return `${formatNoteId(date)}.md`;
}

/**
 * Generates a collision-free note ID by incrementing the second counter
 * until the candidate ID is not present in the existing set.
 *
 * This mirrors the Rust-side collision-check logic described in
 * storage_fileformat_design.md §4.1.
 *
 * @param existingIds - Set of already-used note IDs (filename stems)
 * @param date - Base date (defaults to now)
 * @returns A unique note ID not present in existingIds
 */
export function generateUniqueNoteId(
  existingIds: ReadonlySet<string>,
  date: Date = new Date(),
): string {
  let candidate = formatNoteId(date);
  if (!existingIds.has(candidate)) {
    return candidate;
  }

  // Increment by seconds until we find a free slot
  const base = new Date(date);
  for (let delta = 1; delta < 3600; delta++) {
    const shifted = new Date(base.getTime() + delta * 1000);
    candidate = formatNoteId(shifted);
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  // Fallback: append milliseconds (should never be reached in normal use)
  return `${formatNoteId(date)}_${date.getMilliseconds()}`;
}

export interface ParsedNoteId {
  id: string;
  /** ISO 8601 string: "YYYY-MM-DDTHH:MM:SS" */
  created_at: string;
}

/**
 * Parses a note filename or note ID into its structured form.
 * Accepts both "YYYY-MM-DDTHHMMSS.md" and "YYYY-MM-DDTHHMMSS".
 *
 * @throws {Error} if the input does not match the expected format
 */
export function parseNoteFilename(input: string): ParsedNoteId {
  const stem = input.endsWith('.md') ? input.slice(0, -3) : input;

  if (!NOTE_ID_PATTERN.test(stem)) {
    throw new Error(
      `Invalid note filename: "${input}". Expected format: YYYY-MM-DDTHHMMSS[.md]`,
    );
  }

  // stem = "2026-04-11T143052"
  const datePart = stem.slice(0, 10); // "2026-04-11"
  const timePart = stem.slice(11);    // "143052"
  const hh = timePart.slice(0, 2);
  const mm = timePart.slice(2, 4);
  const ss = timePart.slice(4, 6);
  const created_at = `${datePart}T${hh}:${mm}:${ss}`;

  return { id: stem, created_at };
}

/**
 * Returns true if the given string is a valid note filename stem or
 * full filename.
 */
export function isValidNoteFilename(input: string): boolean {
  try {
    parseNoteFilename(input);
    return true;
  } catch {
    return false;
  }
}
