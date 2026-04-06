// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:grid_search > detail:storage_fileformat

import { DEFAULT_FILTER_DAYS } from './types';

/**
 * Formats a Date to "YYYY-MM-DD" string for IPC date parameters.
 * Rust-side parses this with chrono::NaiveDate::parse_from_str.
 */
export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the default 7-day filter window: { from_date, to_date }.
 * from_date = today − 7 days, to_date = today.
 * Computation is owned by the frontend (module:grid) — Rust side has no default.
 */
export function getDefaultDateRange(): { from_date: string; to_date: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - DEFAULT_FILTER_DAYS);
  return {
    from_date: formatDateParam(sevenDaysAgo),
    to_date: formatDateParam(now),
  };
}

/**
 * Parses a filename timestamp (YYYY-MM-DDTHHMMSS) into a human-readable string.
 * Example: "2026-04-04T143052" → "2026-04-04 14:30"
 */
export function formatCreatedAt(createdAt: string): string {
  if (createdAt.length < 15) return createdAt;
  const datePart = createdAt.slice(0, 10);
  const hh = createdAt.slice(11, 13);
  const mm = createdAt.slice(13, 15);
  return `${datePart} ${hh}:${mm}`;
}

/**
 * Validates that a filename conforms to the YYYY-MM-DDTHHMMSS(_N)?.md pattern.
 * This is a frontend-side guard; authoritative validation happens in Rust.
 */
export function isValidNoteFilename(filename: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{6}(_\d+)?\.md$/.test(filename);
}
