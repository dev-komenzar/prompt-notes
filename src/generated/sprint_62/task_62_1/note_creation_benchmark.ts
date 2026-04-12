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
// Target: AC-EDIT-03 新規ノート作成レイテンシ 100ms 以下

import { invoke } from '@tauri-apps/api/core';
import type { BenchmarkResult, NoteCreationBenchmarkConfig } from './types';
import { measureAsync, mean, percentile } from './timing';

const DEFAULT_CONFIG: NoteCreationBenchmarkConfig = {
  iterations: 10,
  expectedMaxMs: 100,
};

/**
 * invoke('create_note') のラウンドトリップレイテンシを計測する。
 * 作成したノートは計測後に invoke('delete_note') で削除してクリーンアップする。
 */
export async function benchmarkNoteCreation(
  config: NoteCreationBenchmarkConfig = DEFAULT_CONFIG,
): Promise<BenchmarkResult> {
  const durations: number[] = [];

  for (let i = 0; i < config.iterations; i++) {
    const { result: metadata, sample } = await measureAsync(
      'create_note',
      () => invoke<{ id: string; tags: string[]; created_at: string; preview: string }>('create_note'),
    );

    durations.push(sample.durationMs);

    // クリーンアップ：作成したノートを削除
    try {
      await invoke('delete_note', { id: metadata.id });
    } catch {
      // クリーンアップ失敗は計測結果に影響しない
    }

    // 連続作成による衝突を避けるため 10ms 待機
    await new Promise((r) => setTimeout(r, 10));
  }

  const p95 = percentile(durations, 95);
  const avg = mean(durations);

  return {
    name: 'note_creation_latency',
    target: `p95 ≤ ${config.expectedMaxMs}ms`,
    measured: Math.round(p95 * 100) / 100,
    unit: 'ms (p95)',
    passed: p95 <= config.expectedMaxMs,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 単発計測。UI から呼び出して即時フィードバックに使う。
 */
export async function measureSingleNoteCreation(): Promise<number> {
  const { result: metadata, sample } = await measureAsync(
    'create_note_single',
    () => invoke<{ id: string }>('create_note'),
  );
  try {
    await invoke('delete_note', { id: metadata.id });
  } catch {
    // ignore
  }
  return sample.durationMs;
}
