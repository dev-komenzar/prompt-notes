// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 68-1
// @task-title: M3（M3-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=68, task=68-1, module=module:editor, oq=OQ-004
// Resolves OQ-004: 自動保存デバウンス間隔（500ms vs 1000ms 等）

import type { AutoSaveConfig, DebouncePreset } from './types';

/**
 * Default auto-save configuration.
 * debounceMs=500 is the design baseline from component_architecture §4.2.
 * OQ-004 mandates evaluation of 500ms vs 1000ms; this value is the tunable target.
 */
export const DEFAULT_AUTOSAVE_CONFIG: Readonly<AutoSaveConfig> = {
  debounceMs: 500,
  maxDeferMs: 5000,
  flushOnVisibilityChange: true,
} as const;

/**
 * Preset configurations for OQ-004 A/B evaluation.
 *
 * - RESPONSIVE (500ms): Lower latency between last keystroke and persist.
 *   Slightly higher file I/O frequency during rapid typing bursts.
 *
 * - BALANCED (750ms): Middle ground. Reduces I/O by ~33% vs 500ms while
 *   keeping perceived immediacy acceptable.
 *
 * - CONSERVATIVE (1000ms): Minimizes I/O. Suitable if profiling shows
 *   file write contention on slower storage (e.g., encrypted home dirs).
 */
export const DEBOUNCE_PRESETS: Readonly<Record<DebouncePreset, AutoSaveConfig>> = {
  500: {
    debounceMs: 500,
    maxDeferMs: 5000,
    flushOnVisibilityChange: true,
  },
  750: {
    debounceMs: 750,
    maxDeferMs: 6000,
    flushOnVisibilityChange: true,
  },
  1000: {
    debounceMs: 1000,
    maxDeferMs: 8000,
    flushOnVisibilityChange: true,
  },
} as const;

/**
 * Creates a validated AutoSaveConfig, clamping values to safe ranges.
 * debounceMs is clamped to [100, 5000].
 * maxDeferMs is clamped to [0, 30000] and must be >= debounceMs (or 0 to disable).
 */
export function createAutoSaveConfig(
  partial?: Partial<AutoSaveConfig>,
): AutoSaveConfig {
  const base = { ...DEFAULT_AUTOSAVE_CONFIG, ...partial };
  const debounceMs = clamp(base.debounceMs, 100, 5000);
  let maxDeferMs = clamp(base.maxDeferMs, 0, 30000);
  if (maxDeferMs !== 0 && maxDeferMs < debounceMs) {
    maxDeferMs = debounceMs * 2;
  }
  return {
    debounceMs,
    maxDeferMs,
    flushOnVisibilityChange: base.flushOnVisibilityChange,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
