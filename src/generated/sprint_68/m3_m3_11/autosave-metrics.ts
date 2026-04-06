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
// Metrics collector for evaluating debounce interval effectiveness.

import type { AutoSaveMetric, AutoSaveSessionMetrics } from './types';

/**
 * Ring-buffer metrics collector for auto-save timing data.
 * Collects per-save metrics and computes session aggregates for
 * OQ-004 interval comparison (500ms vs 1000ms).
 *
 * Metrics are kept in-memory only. No persistence, no IPC, no file I/O.
 * Buffer capacity prevents unbounded memory growth in long sessions.
 */
export class AutoSaveMetricsCollector {
  private readonly buffer: AutoSaveMetric[];
  private readonly capacity: number;
  private writeIndex = 0;
  private count = 0;
  private readonly configuredIntervalMs: number;

  constructor(configuredIntervalMs: number, capacity = 500) {
    this.configuredIntervalMs = configuredIntervalMs;
    this.capacity = Math.max(1, capacity);
    this.buffer = new Array<AutoSaveMetric>(this.capacity);
  }

  /**
   * Record a completed save cycle.
   */
  record(metric: AutoSaveMetric): void {
    this.buffer[this.writeIndex] = metric;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Create a metric builder for tracking a single save cycle.
   */
  startCycle(): SaveCycleTracker {
    return new SaveCycleTracker(this);
  }

  /**
   * Compute aggregated session metrics from collected data.
   */
  summarize(): AutoSaveSessionMetrics {
    if (this.count === 0) {
      return {
        totalSaves: 0,
        totalCoalescedChanges: 0,
        avgDebounceLatencyMs: 0,
        avgIpcLatencyMs: 0,
        p95IpcLatencyMs: 0,
        forcedFlushCount: 0,
        configuredIntervalMs: this.configuredIntervalMs,
      };
    }

    const metrics = this.getAll();
    let totalCoalesced = 0;
    let totalDebounceLatency = 0;
    let forcedFlushCount = 0;
    const ipcLatencies: number[] = [];

    for (const m of metrics) {
      totalCoalesced += m.coalescedChanges;
      totalDebounceLatency += m.saveInitiatedAt - m.firstChangeAt;
      ipcLatencies.push(m.saveCompletedAt - m.saveInitiatedAt);
      if (m.wasForcedFlush) forcedFlushCount++;
    }

    ipcLatencies.sort((a, b) => a - b);
    const p95Index = Math.min(
      Math.ceil(ipcLatencies.length * 0.95) - 1,
      ipcLatencies.length - 1,
    );

    return {
      totalSaves: metrics.length,
      totalCoalescedChanges: totalCoalesced,
      avgDebounceLatencyMs: totalDebounceLatency / metrics.length,
      avgIpcLatencyMs:
        ipcLatencies.reduce((s, v) => s + v, 0) / ipcLatencies.length,
      p95IpcLatencyMs: ipcLatencies[p95Index],
      forcedFlushCount,
      configuredIntervalMs: this.configuredIntervalMs,
    };
  }

  /**
   * Reset all collected metrics.
   */
  reset(): void {
    this.writeIndex = 0;
    this.count = 0;
  }

  private getAll(): AutoSaveMetric[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count);
    }
    return [
      ...this.buffer.slice(this.writeIndex),
      ...this.buffer.slice(0, this.writeIndex),
    ];
  }
}

/**
 * Tracks timing for a single auto-save cycle.
 */
export class SaveCycleTracker {
  private firstChangeAt = 0;
  private coalescedChanges = 0;
  private saveInitiatedAt = 0;
  private readonly collector: AutoSaveMetricsCollector;

  constructor(collector: AutoSaveMetricsCollector) {
    this.collector = collector;
  }

  /**
   * Record a document change event. Call on each EditorView docChanged.
   */
  recordChange(): void {
    if (this.firstChangeAt === 0) {
      this.firstChangeAt = Date.now();
    }
    this.coalescedChanges++;
  }

  /**
   * Mark save initiation (debounce timer fired or forced flush).
   */
  markSaveInitiated(): void {
    this.saveInitiatedAt = Date.now();
  }

  /**
   * Mark save completion and commit metric to collector.
   * @param wasForcedFlush True if triggered by flush() rather than debounce timer.
   */
  complete(wasForcedFlush: boolean): void {
    if (this.firstChangeAt === 0 || this.saveInitiatedAt === 0) return;
    this.collector.record({
      firstChangeAt: this.firstChangeAt,
      saveInitiatedAt: this.saveInitiatedAt,
      saveCompletedAt: Date.now(),
      coalescedChanges: this.coalescedChanges,
      wasForcedFlush,
    });
  }

  /**
   * Whether any changes have been recorded in this cycle.
   */
  get hasChanges(): boolean {
    return this.coalescedChanges > 0;
  }

  /**
   * Reset for reuse in the next cycle.
   */
  reset(): void {
    this.firstChangeAt = 0;
    this.coalescedChanges = 0;
    this.saveInitiatedAt = 0;
  }
}
