// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md §4.8
// Sprint 33 non-functional requirement performance verification.
// Targets (release-blocking):
//   new-note-creation : ≤ 100 ms  (AC-EDIT-03)
//   copy-operation    : ≤  50 ms  (AC-EDIT-04)
//   cm6-init          : ≤ 200 ms  (ADR-003)

export const PERF_TARGETS = {
  'new-note-creation': 100,
  'copy-operation': 50,
  'cm6-init': 200,
} as const;

export type PerfMeasureName = keyof typeof PERF_TARGETS;

export interface PerfEntry {
  duration: number;
  target: number;
  pass: boolean;
}

export function perfMark(name: string): void {
  try {
    performance.mark(name);
  } catch {
    /* no-op in environments without performance API */
  }
}

export function perfMeasure(
  startMark: string,
  endMark: string,
  measureName: PerfMeasureName,
): number {
  try {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName, 'measure');
    if (entries.length === 0) return -1;
    const duration = entries[entries.length - 1].duration;
    const target = PERF_TARGETS[measureName];
    const pass = duration <= target;
    const label = pass ? 'PASS' : 'FAIL';
    // eslint-disable-next-line no-console
    console.debug(`[Sprint33/Perf] ${measureName}: ${duration.toFixed(1)} ms / ${target} ms [${label}]`);
    if (!pass) {
      console.warn(
        `[Sprint33/Perf] FAIL: ${measureName} exceeded target — ` +
          `${duration.toFixed(1)} ms > ${target} ms`,
      );
    }
    return duration;
  } catch {
    return -1;
  }
}

export function getPerfReport(): Record<PerfMeasureName, PerfEntry | null> {
  const names = Object.keys(PERF_TARGETS) as PerfMeasureName[];
  const report = {} as Record<PerfMeasureName, PerfEntry | null>;
  for (const name of names) {
    try {
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length === 0) {
        report[name] = null;
      } else {
        const duration = entries[entries.length - 1].duration;
        const target = PERF_TARGETS[name];
        report[name] = { duration, target, pass: duration <= target };
      }
    } catch {
      report[name] = null;
    }
  }
  return report;
}

// Expose to window for Playwright/devtools access during Sprint 33 verification
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__promptnotes_perf = getPerfReport;
}
