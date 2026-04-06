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
// convention: module:storage — パストラバーサル防止。ファイル名バリデーション。

import { FILENAME_REGEX, PATH_TRAVERSAL_CHARS } from './constants';
import { FilenameValidationError } from './types';

/**
 * Validates that a filename conforms to the PromptNotes naming convention.
 *
 * Accepted formats:
 *   - YYYY-MM-DDTHHMMSS.md        (base filename)
 *   - YYYY-MM-DDTHHMMSS_N.md      (suffixed filename, N >= 1)
 *
 * Security: rejects path traversal attempts (../, /, \).
 *
 * @param filename - The filename string to validate
 * @returns true if valid
 * @throws FilenameValidationError if invalid
 */
export function validateFilename(filename: string): true {
  if (!filename || typeof filename !== 'string') {
    throw new FilenameValidationError(
      filename ?? '',
      'Filename must be a non-empty string',
    );
  }

  if (PATH_TRAVERSAL_CHARS.test(filename)) {
    throw new FilenameValidationError(
      filename,
      `Filename contains forbidden path traversal characters: "${filename}"`,
    );
  }

  if (!FILENAME_REGEX.test(filename)) {
    throw new FilenameValidationError(
      filename,
      `Filename does not match pattern YYYY-MM-DDTHHMMSS[_N].md: "${filename}"`,
    );
  }

  const match = filename.match(FILENAME_REGEX)!;
  const datePart = match[1];
  const timePart = match[2];
  const suffixStr = match[3];

  if (!isValidDate(datePart)) {
    throw new FilenameValidationError(
      filename,
      `Filename contains invalid date: "${datePart}"`,
    );
  }

  if (!isValidTime(timePart)) {
    throw new FilenameValidationError(
      filename,
      `Filename contains invalid time: "${timePart}"`,
    );
  }

  if (suffixStr !== undefined) {
    const suffixNum = parseInt(suffixStr, 10);
    if (suffixNum < 1) {
      throw new FilenameValidationError(
        filename,
        `Filename suffix must be >= 1, got: ${suffixNum}`,
      );
    }
  }

  return true;
}

/**
 * Non-throwing variant: returns whether the filename is valid.
 */
export function isValidFilename(filename: string): boolean {
  try {
    validateFilename(filename);
    return true;
  } catch {
    return false;
  }
}

function isValidDate(datePart: string): boolean {
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidTime(timePart: string): boolean {
  const hours = parseInt(timePart.substring(0, 2), 10);
  const minutes = parseInt(timePart.substring(2, 4), 10);
  const seconds = parseInt(timePart.substring(4, 6), 10);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
}
