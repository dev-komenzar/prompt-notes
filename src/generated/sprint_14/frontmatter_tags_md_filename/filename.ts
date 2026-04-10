// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: ファイル名生成 → frontmatter テンプレート（空 `tags`）付き `.md` ファイル作成 → `{filename}` 返却
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 14
// @task: 14-1

/**
 * Filename validation and parsing utilities for PromptNotes.
 *
 * Filename format: YYYY-MM-DDTHHMMSS.md (e.g. 2026-04-10T143205.md)
 * Per NNC-S1, filenames are immutable after creation and serve as
 * the note's unique identifier.
 *
 * NOTE: Filename *generation* is owned exclusively by module:storage (Rust).
 * The frontend never generates filenames — it receives them from `create_note`.
 * These utilities are for validation and date extraction only.
 */

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

/**
 * Validates that a filename conforms to the YYYY-MM-DDTHHMMSS.md format.
 */
export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

/**
 * Extracts an ISO 8601 datetime string from a note filename.
 * Returns null if the filename does not match the expected format.
 *
 * @example
 * parseCreatedAtFromFilename("2026-04-10T143205.md")
 * // => "2026-04-10T14:32:05"
 */
export function parseCreatedAtFromFilename(filename: string): string | null {
  if (!isValidNoteFilename(filename)) {
    return null;
  }
  const base = filename.replace(/\.md$/, '');
  const datePart = base.slice(0, 10);
  const timePart = base.slice(11);
  const hh = timePart.slice(0, 2);
  const mm = timePart.slice(2, 4);
  const ss = timePart.slice(4, 6);
  return `${datePart}T${hh}:${mm}:${ss}`;
}

/**
 * Extracts a Date object from a note filename.
 * Returns null if the filename does not match the expected format.
 */
export function parseDateFromFilename(filename: string): Date | null {
  const iso = parseCreatedAtFromFilename(filename);
  if (iso === null) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
