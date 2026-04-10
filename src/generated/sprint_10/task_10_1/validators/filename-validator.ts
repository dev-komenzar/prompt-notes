// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @generated-by: codd generate --wave 10

const FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{6}\.md$/;

export function isValidNoteFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename);
}

export function parseCreatedAtFromFilename(
  filename: string,
): string | null {
  if (!isValidNoteFilename(filename)) {
    return null;
  }
  const base = filename.replace('.md', '');
  const datePart = base.slice(0, 10);
  const timePart = base.slice(11);
  const hours = timePart.slice(0, 2);
  const minutes = timePart.slice(2, 4);
  const seconds = timePart.slice(4, 6);
  return `${datePart}T${hours}:${minutes}:${seconds}`;
}

export function validateFilenameTimestamp(filename: string): {
  valid: boolean;
  reason: string;
} {
  if (!FILENAME_REGEX.test(filename)) {
    return {
      valid: false,
      reason: `Filename "${filename}" does not match pattern YYYY-MM-DDTHHMMSS.md`,
    };
  }

  const iso = parseCreatedAtFromFilename(filename);
  if (iso === null) {
    return { valid: false, reason: 'Failed to parse timestamp from filename' };
  }

  const date = new Date(iso);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      reason: `Parsed timestamp "${iso}" is not a valid date`,
    };
  }

  return { valid: true, reason: 'OK' };
}
