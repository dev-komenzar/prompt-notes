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
// Target: 検索応答時間 数百 ms 以内（想定数十件/週）

import { invoke } from '@tauri-apps/api/core';
import type { BenchmarkResult, SearchBenchmarkConfig } from './types';
import { measureAsync, mean, percentile } from './timing';

const DEFAULT_CONFIG: SearchBenchmarkConfig = {
  queries: ['test', 'the', 'prompt', 'a', ''],
  expectedMaxMs: 500,
};

/**
 * search_notes / list_notes の応答時間を計測する。
 * query が空の場合は list_notes、非空の場合は search_notes を使用する。
 */
export async function benchmarkSearch(
  config: SearchBenchmarkConfig = DEFAULT_CONFIG,
): Promise<BenchmarkResult> {
  const durations: number[] = [];

  const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const dateTo = new Date().toISOString().slice(0, 10);
  const filter = { date_from: dateFrom, date_to: dateTo };

  for (const query of config.queries) {
    const { sample } = await measureAsync(`search_notes:${query || '<empty>'}`, () => {
      if (query) {
        return invoke('search_notes', { query, filter });
      } else {
        return invoke('list_notes', { filter });
      }
    });
    durations.push(sample.durationMs);
  }

  const p95 = percentile(durations, 95);

  return {
    name: 'search_response_time',
    target: `p95 ≤ ${config.expectedMaxMs}ms`,
    measured: Math.round(p95 * 100) / 100,
    unit: 'ms (p95)',
    passed: p95 <= config.expectedMaxMs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * グリッドビューのデフォルト表示（直近7日間 list_notes）のレイテンシを計測する。
 */
export async function benchmarkGridDefaultLoad(): Promise<BenchmarkResult> {
  const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const dateTo = new Date().toISOString().slice(0, 10);

  const { sample } = await measureAsync('grid_default_load', () =>
    invoke('list_notes', { filter: { date_from: dateFrom, date_to: dateTo } }),
  );

  return {
    name: 'grid_default_load',
    target: '≤ 200ms',
    measured: Math.round(sample.durationMs * 100) / 100,
    unit: 'ms',
    passed: sample.durationMs <= 200,
    timestamp: new Date().toISOString(),
  };
}
