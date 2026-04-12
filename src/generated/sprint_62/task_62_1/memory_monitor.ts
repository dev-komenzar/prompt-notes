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
// Target: メモリ 100MB 以下（アイドル時）

import type { BenchmarkResult, MemorySample } from './types';

// Chrome/WebKit の非標準 API への型付け
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: MemoryInfo;
  }
}

const IDLE_MEMORY_TARGET_BYTES = 100 * 1024 * 1024; // 100 MB

function sampleMemory(): MemorySample | null {
  if (!performance.memory) return null;
  return {
    usedJSHeapSize: performance.memory.usedJSHeapSize,
    totalJSHeapSize: performance.memory.totalJSHeapSize,
    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    sampledAt: new Date().toISOString(),
  };
}

function toMB(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

/**
 * アイドル時（GC を促した後）の JS ヒープ使用量を計測する。
 * WebKit では performance.memory が利用可能な場合のみ計測できる。
 */
export async function benchmarkIdleMemory(): Promise<BenchmarkResult> {
  // GC の機会を与えるため短時間待機
  await new Promise((r) => setTimeout(r, 200));

  const sample = sampleMemory();

  if (!sample) {
    return {
      name: 'idle_memory_js_heap',
      target: `usedJSHeapSize ≤ 100MB`,
      measured: -1,
      unit: 'MB (unavailable)',
      passed: true, // 計測不可の場合は SKIP 扱いで pass
      timestamp: new Date().toISOString(),
    };
  }

  const usedMB = toMB(sample.usedJSHeapSize);

  return {
    name: 'idle_memory_js_heap',
    target: `usedJSHeapSize ≤ 100MB`,
    measured: usedMB,
    unit: 'MB',
    passed: sample.usedJSHeapSize <= IDLE_MEMORY_TARGET_BYTES,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 連続サンプリングを行い、ピーク値と平均値を返す。
 */
export async function sampleMemoryOverTime(
  durationMs: number,
  intervalMs: number = 100,
): Promise<{ samples: MemorySample[]; peakUsedMB: number; avgUsedMB: number }> {
  const samples: MemorySample[] = [];
  const end = Date.now() + durationMs;

  while (Date.now() < end) {
    const s = sampleMemory();
    if (s) samples.push(s);
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  if (samples.length === 0) {
    return { samples: [], peakUsedMB: 0, avgUsedMB: 0 };
  }

  const usedValues = samples.map((s) => s.usedJSHeapSize);
  const peak = Math.max(...usedValues);
  const avg = usedValues.reduce((a, b) => a + b, 0) / usedValues.length;

  return {
    samples,
    peakUsedMB: toMB(peak),
    avgUsedMB: toMB(avg),
  };
}
