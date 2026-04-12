// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: docs/detailed_design/grid_search_design.md §4.7
// Sprint 44 非機能要件検証ユーティリティ

export const PERF_MARKS = {
  GRID_MOUNT_START: 'grid:mount:start',
  GRID_MOUNT_END: 'grid:mount:end',
  SEARCH_ISSUE: 'grid:search:issue',
  SEARCH_DONE: 'grid:search:done',
  CARD_CLICK: 'grid:card_click',
  EDITOR_READY: 'grid:editor_ready',
} as const;

/** Sprint 44 閾値（ms） */
export const THRESHOLDS = {
  INITIAL_MOUNT: 100,
  FULL_TEXT_SEARCH: 200,
  CARD_TO_EDITOR: 150,
} as const;

export function mark(name: string): void {
  performance.mark(name);
}

export function measure(
  label: string,
  startMark: string,
  endMark: string,
  threshold: number,
): number {
  const ends = performance.getEntriesByName(endMark, 'mark');
  const starts = performance.getEntriesByName(startMark, 'mark');
  if (starts.length === 0 || ends.length === 0) return -1;
  const dur =
    ends[ends.length - 1].startTime - starts[starts.length - 1].startTime;
  if (import.meta.env.DEV) {
    const ok = dur <= threshold;
    console.debug(
      `[perf] ${ok ? '✓' : '✗'} ${label}: ${dur.toFixed(1)}ms (≤${threshold}ms)`,
    );
    if (!ok) {
      console.warn(`[perf] THRESHOLD EXCEEDED: ${label} ${dur.toFixed(1)}ms > ${threshold}ms`);
    }
  }
  return dur;
}
