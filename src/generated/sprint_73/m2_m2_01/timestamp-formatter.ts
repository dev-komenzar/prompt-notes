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
// convention: module:storage — タイムスタンプフォーマット。Rust chrono と同等ロジック（参照実装）。

import { NOTE_EXTENSION } from './constants';

/**
 * Formats a Date into the PromptNotes timestamp string: YYYY-MM-DDTHHMMSS
 *
 * NOTE: In production, filename generation is exclusively owned by
 * module:storage (Rust backend, chrono crate). This TypeScript
 * implementation serves as a reference/test utility and must NOT
 * be used by frontend components to generate filenames for persistence.
 * All filename generation must go through the create_note IPC command.
 *
 * @param date - The date to format (defaults to current local time)
 * @returns Timestamp string, e.g. "2026-04-04T143052"
 */
export function formatTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}${minutes}${seconds}`;
}

/**
 * Formats a Date into a base PromptNotes filename: YYYY-MM-DDTHHMMSS.md
 *
 * Same ownership caveat as formatTimestamp applies.
 *
 * @param date - The date to format (defaults to current local time)
 * @returns Base filename, e.g. "2026-04-04T143052.md"
 */
export function formatBaseFilename(date: Date = new Date()): string {
  return `${formatTimestamp(date)}${NOTE_EXTENSION}`;
}

/**
 * Constructs a suffixed filename from a base timestamp and suffix number.
 *
 * @param baseTimestamp - The base timestamp, e.g. "2026-04-04T143052"
 * @param suffix - The suffix number (>= 1)
 * @returns Suffixed filename, e.g. "2026-04-04T143052_1.md"
 */
export function formatSuffixedFilename(baseTimestamp: string, suffix: number): string {
  if (suffix < 1) {
    throw new RangeError(`Suffix must be >= 1, got: ${suffix}`);
  }
  return `${baseTimestamp}_${suffix}${NOTE_EXTENSION}`;
}
