// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 62-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 62
// @task: 62-1 全モジュール 非機能要件計測

import type { LatencySample } from './types';

export function now(): number {
  return performance.now();
}

export function measure(operationName: string, startMs: number): LatencySample {
  const endMs = performance.now();
  return {
    operationName,
    startMs,
    endMs,
    durationMs: endMs - startMs,
  };
}

export async function measureAsync<T>(
  operationName: string,
  fn: () => Promise<T>,
): Promise<{ result: T; sample: LatencySample }> {
  const startMs = performance.now();
  const result = await fn();
  const sample = measure(operationName, startMs);
  return { result, sample };
}

export function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function mean(samples: number[]): number {
  if (samples.length === 0) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}
