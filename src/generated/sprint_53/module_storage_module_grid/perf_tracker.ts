// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: `module:storage`, `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:53 task:53-1 module:storage,grid milestone:パフォーマンス計測

import type {
  PerfSample,
  PerfModule,
  OperationName,
  PerfTrackerConfig,
  ThresholdCheckResult,
  ViolationCallback,
} from './types';
import { getThreshold } from './thresholds';
import { generateSampleId, now, isoTimestamp } from './perf_utils';

const DEFAULT_CONFIG: PerfTrackerConfig = {
  maxSamples: 10_000,
  realtimeThresholdCheck: true,
  consoleLog: false,
};

/**
 * Core performance tracker that collects and stores measurement samples.
 *
 * Usage:
 *   const tracker = PerfTracker.getInstance();
 *   const end = tracker.startMeasure('storage', 'list_notes');
 *   // ... perform operation ...
 *   end({ noteCount: 42 });  // records the sample
 */
export class PerfTracker {
  private static _instance: PerfTracker | null = null;

  private readonly _samples: PerfSample[] = [];
  private readonly _violations: ThresholdCheckResult[] = [];
  private _config: PerfTrackerConfig;

  private constructor(config?: Partial<PerfTrackerConfig>) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(config?: Partial<PerfTrackerConfig>): PerfTracker {
    if (!PerfTracker._instance) {
      PerfTracker._instance = new PerfTracker(config);
    }
    return PerfTracker._instance;
  }

  /**
   * Reset the singleton (primarily for testing).
   */
  static resetInstance(): void {
    PerfTracker._instance = null;
  }

  /**
   * Update configuration at runtime.
   */
  configure(config: Partial<PerfTrackerConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * Get current configuration.
   */
  getConfig(): Readonly<PerfTrackerConfig> {
    return { ...this._config };
  }

  /**
   * Start measuring an operation. Returns a function to call when the
   * operation completes.
   *
   * @param module - The module being measured.
   * @param operation - The operation being measured.
   * @returns A function that finalizes the measurement. Pass optional
   *          metadata and success flag. Defaults to success=true.
   */
  startMeasure(
    module: PerfModule,
    operation: OperationName,
  ): (metadata?: Record<string, string | number | boolean>, success?: boolean) => PerfSample {
    const startTime = now();
    const id = generateSampleId(module, operation);

    return (
      metadata?: Record<string, string | number | boolean>,
      success: boolean = true,
    ): PerfSample => {
      const endTime = now();
      const durationMs = endTime - startTime;

      const sample: PerfSample = {
        id,
        module,
        operation,
        startTime,
        durationMs,
        timestamp: isoTimestamp(),
        success,
        metadata,
      };

      this._recordSample(sample);
      return sample;
    };
  }

  /**
   * Record a pre-built sample directly (e.g., from external instrumentation).
   */
  recordSample(sample: PerfSample): void {
    this._recordSample(sample);
  }

  /**
   * Convenience method to measure an async operation.
   */
  async measureAsync<T>(
    module: PerfModule,
    operation: OperationName,
    fn: () => Promise<T>,
    metadata?: Record<string, string | number | boolean>,
  ): Promise<{ result: T; sample: PerfSample }> {
    const end = this.startMeasure(module, operation);
    try {
      const result = await fn();
      const sample = end(metadata, true);
      return { result, sample };
    } catch (err) {
      const sample = end(
        { ...metadata, error: err instanceof Error ? err.message : String(err) },
        false,
      );
      throw err;
    }
  }

  /**
   * Convenience method to measure a sync operation.
   */
  measureSync<T>(
    module: PerfModule,
    operation: OperationName,
    fn: () => T,
    metadata?: Record<string, string | number | boolean>,
  ): { result: T; sample: PerfSample } {
    const end = this.startMeasure(module, operation);
    try {
      const result = fn();
      const sample = end(metadata, true);
      return { result, sample };
    } catch (err) {
      const sample = end(
        { ...metadata, error: err instanceof Error ? err.message : String(err) },
        false,
      );
      throw err;
    }
  }

  /**
   * Get all recorded samples.
   */
  getSamples(): ReadonlyArray<PerfSample> {
    return [...this._samples];
  }

  /**
   * Get samples filtered by module and/or operation.
   */
  getSamplesFiltered(
    module?: PerfModule,
    operation?: OperationName,
  ): ReadonlyArray<PerfSample> {
    return this._samples.filter((s) => {
      if (module && s.module !== module) return false;
      if (operation && s.operation !== operation) return false;
      return true;
    });
  }

  /**
   * Get all threshold violations detected so far.
   */
  getViolations(): ReadonlyArray<ThresholdCheckResult> {
    return [...this._violations];
  }

  /**
   * Get the count of samples by module.
   */
  getSampleCount(module?: PerfModule): number {
    if (!module) return this._samples.length;
    return this._samples.filter((s) => s.module === module).length;
  }

  /**
   * Clear all recorded samples and violations.
   */
  clear(): void {
    this._samples.length = 0;
    this._violations.length = 0;
  }

  private _recordSample(sample: PerfSample): void {
    // Enforce max samples (ring buffer behavior)
    if (this._samples.length >= this._config.maxSamples) {
      this._samples.shift();
    }
    this._samples.push(sample);

    if (this._config.consoleLog) {
      const status = sample.success ? '✓' : '✗';
      console.log(
        `[perf] ${status} ${sample.module}/${sample.operation}: ${sample.durationMs.toFixed(2)}ms`,
      );
    }

    if (this._config.realtimeThresholdCheck) {
      this._checkThreshold(sample);
    }
  }

  private _checkThreshold(sample: PerfSample): void {
    const threshold = getThreshold(sample.operation, sample.module);
    if (!threshold) return;

    const overageMs = sample.durationMs - threshold.maxDurationMs;
    const ratio = sample.durationMs / threshold.maxDurationMs;
    const passed = sample.durationMs <= threshold.maxDurationMs;

    const result: ThresholdCheckResult = {
      sample,
      threshold,
      passed,
      overageMs,
      ratio,
    };

    if (!passed) {
      this._violations.push(result);
      if (this._config.onViolation) {
        this._config.onViolation(result);
      }
    }
  }
}
