// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Client-side filename validation utilities.
// Primary validation and path-traversal prevention is enforced by the Rust backend.
// These helpers provide early feedback in the frontend layer.

import { FILENAME_PATTERN } from './constants';

/**
 * Returns true when `filename` matches the canonical note filename pattern
 * `YYYY-MM-DDTHHMMSS.md` (with optional `_N` collision suffix).
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_PATTERN.test(filename);
}

/**
 * Parses the creation timestamp embedded in a note filename.
 * Returns a Date in local time, or null if the filename does not match the pattern.
 *
 * Example: "2026-04-04T143052.md" → Date(2026, 3, 4, 14, 30, 52)
 */
export function parseCreatedAtFromFilename(filename: string): Date | null {
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})/,
  );
  if (!match) {
    return null;
  }
  const [, y, mo, d, h, mi, s] = match;
  return new Date(
    parseInt(y, 10),
    parseInt(mo, 10) - 1,
    parseInt(d, 10),
    parseInt(h, 10),
    parseInt(mi, 10),
    parseInt(s, 10),
  );
}
