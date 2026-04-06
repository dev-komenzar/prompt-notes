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
// Auto-save manager: debounced persistence via Tauri IPC save_note.
// Implements component_architecture §4.2 and editor_clipboard_design §4.5.

import type {
  AutoSaveConfig,
  AutoSaveSessionMetrics,
  GetContentFn,
  SaveNoteFn,
} from './types';
import { AutoSaveState } from './types';
import { debounce, type DebouncedFn } from './debounce';
import { DEFAULT_AUTOSAVE_CONFIG } from './autosave-config';
import { AutoSaveMetricsCollector, SaveCycleTracker } from './autosave-metrics';

/**
 * Manages auto-save for a single note editor instance.
 *
 * Lifecycle:
 *   1. Instantiate with filename, save function, and content getter.
 *   2. Call `handleDocChanged()` from CodeMirror's EditorView.updateListener
 *      whenever `update.docChanged` is true.
 *   3. Call `flush()` before note switch or component unmount.
 *   4. Call `dispose()` on component destroy.
 *
 * Designed for OQ-004 evaluation: the debounce interval is configurable
 * and save metrics are collected for comparison analysis.
 */
export class AutoSaveManager {
  private state: AutoSaveState = AutoSaveState.Idle;
  private filename: string;
  private readonly saveFn: SaveNoteFn;
  private readonly getContent: GetContentFn;
  private readonly config: AutoSaveConfig;
  private readonly metrics: AutoSaveMetricsCollector;
  private cycleTracker: SaveCycleTracker;
  private readonly debouncedSave: DebouncedFn<() => Promise<void>>;
  private visibilityHandler: (() => void) | null = null;
  private saveInProgress: Promise<void> | null = null;

  constructor(
    filename: string,
    saveFn: SaveNoteFn,
    getContent: GetContentFn,
    config?: Partial<AutoSaveConfig>,
  ) {
    this.filename = filename;
    this.saveFn = saveFn;
    this.getContent = getContent;
    this.config = { ...DEFAULT_AUTOSAVE_CONFIG, ...config };
    this.metrics = new AutoSaveMetricsCollector(this.config.debounceMs);
    this.cycleTracker = this.metrics.startCycle();

    this.debouncedSave = debounce(
      () => this.executeSave(false),
      this.config.debounceMs,
      this.config.maxDeferMs > 0 ? this.config.maxDeferMs : undefined,
    );

    if (this.config.flushOnVisibilityChange && typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'hidden' && this.debouncedSave.pending) {
          this.flush();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  /**
   * Notify the manager that the editor document has changed.
   * Call this from CodeMirror's EditorView.updateListener when
   * `update.docChanged === true`.
   *
   * Does NOT trigger on cursor moves, selections, or scroll — only
   * actual content changes, per editor_clipboard_design §4.5.
   */
  handleDocChanged(): void {
    if (this.state === AutoSaveState.Disposed) return;

    this.cycleTracker.recordChange();
    this.state = AutoSaveState.Debouncing;
    this.debouncedSave();
  }

  /**
   * Immediately persist any pending changes.
   * Call before:
   *   - Switching to a different note (note switch)
   *   - Component unmount (onDestroy)
   *   - Window close (Tauri close event)
   *
   * Returns a promise that resolves when the save completes.
   * Safe to call when no changes are pending (no-op).
   */
  async flush(): Promise<void> {
    if (this.state === AutoSaveState.Disposed) return;

    if (this.debouncedSave.pending) {
      this.debouncedSave.cancel();
      await this.executeSave(true);
    }

    // Wait for any in-progress save to complete
    if (this.saveInProgress) {
      await this.saveInProgress;
    }
  }

  /**
   * Update the target filename (e.g., after note switch).
   * Flushes pending changes for the previous filename first.
   */
  async switchNote(newFilename: string): Promise<void> {
    await this.flush();
    this.filename = newFilename;
    this.cycleTracker = this.metrics.startCycle();
    this.state = AutoSaveState.Idle;
  }

  /**
   * Permanently dispose the manager. Flushes pending changes first.
   * After disposal, all method calls are no-ops.
   */
  async dispose(): Promise<void> {
    if (this.state === AutoSaveState.Disposed) return;

    await this.flush();
    this.debouncedSave.cancel();

    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    this.state = AutoSaveState.Disposed;
  }

  /**
   * Current state of the auto-save manager.
   */
  get currentState(): AutoSaveState {
    return this.state;
  }

  /**
   * Whether there are unsaved changes pending.
   */
  get hasPendingChanges(): boolean {
    return this.debouncedSave.pending || this.state === AutoSaveState.Saving;
  }

  /**
   * Retrieve aggregated save metrics for OQ-004 interval evaluation.
   */
  getSessionMetrics(): AutoSaveSessionMetrics {
    return this.metrics.summarize();
  }

  /**
   * The currently configured debounce interval in milliseconds.
   */
  get debounceIntervalMs(): number {
    return this.config.debounceMs;
  }

  private async executeSave(wasForcedFlush: boolean): Promise<void> {
    if (this.state === AutoSaveState.Disposed) return;
    if (!this.cycleTracker.hasChanges) return;

    this.state = AutoSaveState.Saving;
    this.cycleTracker.markSaveInitiated();

    const content = this.getContent();
    const tracker = this.cycleTracker;

    // Prepare next cycle immediately so new changes during save are tracked
    this.cycleTracker = this.metrics.startCycle();

    const savePromise = this.saveFn(this.filename, content)
      .then(() => {
        tracker.complete(wasForcedFlush);
      })
      .catch((err: unknown) => {
        // Re-record the failed changes so they are retried on next trigger.
        // The tracker data is lost for metrics but content safety is prioritized.
        if (this.state !== AutoSaveState.Disposed) {
          this.cycleTracker.recordChange();
        }
        // Propagate for caller awareness (flush callers can catch)
        throw err;
      })
      .finally(() => {
        if (this.saveInProgress === savePromise) {
          this.saveInProgress = null;
        }
        if (this.state === AutoSaveState.Saving) {
          this.state = this.debouncedSave.pending
            ? AutoSaveState.Debouncing
            : AutoSaveState.Idle;
        }
      });

    this.saveInProgress = savePromise;
    await savePromise;
  }
}
