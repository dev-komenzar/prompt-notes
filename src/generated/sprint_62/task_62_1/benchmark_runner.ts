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

import type { BenchmarkSuite } from './types';
import { benchmarkNoteCreation } from './note_creation_benchmark';
import { benchmarkAutosaveDebounce } from './autosave_benchmark';
import { benchmarkSearch, benchmarkGridDefaultLoad } from './search_benchmark';
import { benchmarkIdleMemory } from './memory_monitor';
import { binarySizeNotMeasurable } from './binary_size_checker';

/**
 * 全非機能要件ベンチマークを順番に実行し、BenchmarkSuite を返す。
 * CI および手動確認の両用途に対応する。
 */
export async function runAllBenchmarks(): Promise<BenchmarkSuite> {
  const results = await Promise.allSettled([
    benchmarkNoteCreation(),
    benchmarkAutosaveDebounce(),
    benchmarkSearch(),
    benchmarkGridDefaultLoad(),
    benchmarkIdleMemory(),
  ]);

  const resolved = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      name: `benchmark_${i}`,
      target: 'unknown',
      measured: -1,
      unit: 'error',
      passed: false,
      timestamp: new Date().toISOString(),
    };
  });

  // バイナリサイズは WebView 内では計測不可; CI が実値を投入する
  const platform = navigator.platform.toLowerCase().includes('mac') ? 'macos' : 'linux';
  resolved.push(binarySizeNotMeasurable(platform));

  const allPassed = resolved.every((r) => r.passed);

  return {
    suite: 'sprint_62_nonfunctional',
    results: resolved,
    allPassed,
    runAt: new Date().toISOString(),
  };
}

/**
 * 結果をコンソールに表形式で出力する。
 */
export function printBenchmarkSuite(suite: BenchmarkSuite): void {
  console.group(`[Sprint 62] Non-functional benchmark — ${suite.runAt}`);
  for (const r of suite.results) {
    const icon = r.passed ? '✓' : '✗';
    const measured = r.measured < 0 ? 'N/A' : `${r.measured} ${r.unit}`;
    console.log(`${icon} ${r.name}: ${measured} (target: ${r.target})`);
  }
  if (suite.allPassed) {
    console.log('All benchmarks passed.');
  } else {
    console.warn('Some benchmarks FAILED. See above.');
  }
  console.groupEnd();
}
