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
// Target: 自動保存デバウンス 500ms（入力停止から保存 IPC 発行まで）

import type { BenchmarkResult } from './types';

const DEBOUNCE_MS = 500;
const TOLERANCE_MS = 50; // タイマー精度の許容誤差

/**
 * debounce 関数の実装が 500ms を尊守しているかを計測する。
 * 実際の save_note IPC をモックせず、純粋にタイマー動作を検証する。
 */
export function createDebounce(
  fn: () => void,
  delay: number,
): { trigger: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    trigger() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fn, delay);
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

/**
 * debounce が指定遅延後に正確に発火することを計測する。
 * 返り値は実際の発火遅延 (ms)。
 */
export async function measureDebounceFiringDelay(
  debounceMs: number = DEBOUNCE_MS,
): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    const db = createDebounce(() => {
      resolve(performance.now() - start);
    }, debounceMs);

    db.trigger();
  });
}

/**
 * 連続入力中はデバウンスがリセットされ、最後の入力から delay ms 後に発火することを検証する。
 */
export async function measureDebounceReset(
  debounceMs: number = DEBOUNCE_MS,
  inputCount: number = 5,
  inputIntervalMs: number = 100,
): Promise<{ firingDelayFromLastInput: number; passed: boolean }> {
  return new Promise((resolve) => {
    let lastTriggerAt = 0;

    const db = createDebounce(() => {
      const firingDelayFromLastInput = performance.now() - lastTriggerAt;
      resolve({
        firingDelayFromLastInput,
        passed:
          firingDelayFromLastInput >= debounceMs - TOLERANCE_MS &&
          firingDelayFromLastInput <= debounceMs + TOLERANCE_MS,
      });
    }, debounceMs);

    let count = 0;
    const interval = setInterval(() => {
      lastTriggerAt = performance.now();
      db.trigger();
      count++;
      if (count >= inputCount) clearInterval(interval);
    }, inputIntervalMs);
  });
}

export async function benchmarkAutosaveDebounce(): Promise<BenchmarkResult> {
  const { firingDelayFromLastInput, passed } = await measureDebounceReset();

  return {
    name: 'autosave_debounce',
    target: `${DEBOUNCE_MS}ms ± ${TOLERANCE_MS}ms`,
    measured: Math.round(firingDelayFromLastInput * 100) / 100,
    unit: 'ms (delay from last input)',
    passed,
    timestamp: new Date().toISOString(),
  };
}
