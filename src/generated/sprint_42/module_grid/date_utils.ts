// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 42-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:42 task:42-1 module:grid
// Date formatting and computation utilities.
// Default filter: last 7 days (CONV-GRID-1).
// Date params use YYYY-MM-DD format for Rust chrono::NaiveDate parsing.

export function formatDateParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDefaultFromDate(): string {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  return formatDateParam(sevenDaysAgo);
}

export function getDefaultToDate(): string {
  return formatDateParam(new Date());
}

export function getDateRangeForDays(days: number): { from_date: string; to_date: string } {
  const now = new Date();
  const past = new Date(now);
  past.setDate(now.getDate() - days);
  return {
    from_date: formatDateParam(past),
    to_date: formatDateParam(now),
  };
}

export function getAllTimeDateRange(): { from_date: string; to_date: string } {
  return {
    from_date: '2000-01-01',
    to_date: formatDateParam(new Date()),
  };
}

export function formatCreatedAtDisplay(createdAt: string): string {
  if (!createdAt) return '';
  const trimmed = createdAt.replace('T', ' ');
  return trimmed.length >= 16 ? trimmed.slice(0, 16) : trimmed;
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}
