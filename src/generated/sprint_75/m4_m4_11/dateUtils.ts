// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 75-1
// @task-title: M4（M4-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint_75 / task 75-1 / M4-11
// Date utilities for grid default 7-day filter.
// from_date / to_date computation is owned by module:grid (Svelte side).

import { DEFAULT_FILTER_DAYS } from './constants';

function padTwo(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = padTwo(date.getMonth() + 1);
  const d = padTwo(date.getDate());
  return `${y}-${m}-${d}`;
}

export function computeDefaultDateRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - DEFAULT_FILTER_DAYS);

  return {
    fromDate: formatDateISO(sevenDaysAgo),
    toDate: formatDateISO(now),
  };
}

export function parseCreatedAt(filename: string): Date | null {
  // filename: YYYY-MM-DDTHHMMSS.md or YYYY-MM-DDTHHMMSS_N.md
  const match = filename.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})(?:_\d+)?\.md$/,
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
}
