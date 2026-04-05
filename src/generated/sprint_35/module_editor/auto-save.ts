// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — Auto-save manager (OQ-004 validated at 500 ms debounce).
//
// Responsibilities:
//   • Debounce document changes before issuing save_note IPC.
//   • Track save lifecycle via AutoSaveStatus.
//   • Provide flush() for note-switch / destroy / window-close.
//   • Expose status change listener for UI feedback.

import { createDebounce, type DebouncedHandle } from './debounce';
import { saveNote } from './ipc';
import { AUTO_SAVE_DEBOUNCE_MS, type AutoSaveStatus } from './types';

export type AutoSaveStatusListener = (status: AutoSaveStatus) => void;

export class AutoSaveManager {
  private debounced: DebouncedHandle<[]>;
  private pendingSave: { filename: string; content: string } | null = null;
  private saving = false;
  private status: AutoSaveStatus = 'idle';
  private listeners: Set<AutoSaveStatusListener> = new Set();
  private destroyed = false;

  /**
   * @param debounceMs  OQ-004 validated default: 500 ms.
   */
  constructor(debounceMs: number = AUTO_SAVE_DEBOUNCE_MS) {
    this.debounced = createDebounce(() => {
      void this.executeSave();
    }, debounceMs);
  }

  /** Called by EditorView.updateListener when docChanged === true. */
  schedule(filename: string, content: string): void {
    if (this.destroyed) return;
    this.pendingSave = { filename, content };
    this.setStatus('pending');
    this.debounced.call();
  }

  /**
   * Immediately persist any pending content.
   * Must be awaited before note-switch, component destroy, or window close.
   */
  async flush(): Promise<void> {
    this.debounced.cancel();
    await this.executeSave();
  }

  /** Cancel any pending save without executing it. */
  cancel(): void {
    this.debounced.cancel();
    this.pendingSave = null;
    if (this.status === 'pending') {
      this.setStatus('idle');
    }
  }

  /** Register a listener invoked on every status transition. Returns an unsubscribe function. */
  onStatusChange(listener: AutoSaveStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getStatus(): AutoSaveStatus {
    return this.status;
  }

  isPending(): boolean {
    return this.debounced.isPending() || this.pendingSave !== null;
  }

  /** Flush remaining content and release resources. */
  async destroy(): Promise<void> {
    this.destroyed = true;
    await this.flush();
    this.listeners.clear();
  }

  // ---------- internal ----------

  private async executeSave(): Promise<void> {
    if (!this.pendingSave || this.saving) return;

    const { filename, content } = this.pendingSave;
    this.pendingSave = null;
    this.saving = true;
    this.setStatus('saving');

    try {
      await saveNote({ filename, content });
      if (!this.destroyed) {
        this.setStatus('saved');
      }
    } catch (_err: unknown) {
      if (!this.destroyed) {
        this.setStatus('error');
      }
    } finally {
      this.saving = false;
    }
  }

  private setStatus(next: AutoSaveStatus): void {
    if (this.status === next) return;
    this.status = next;
    for (const listener of this.listeners) {
      try {
        listener(next);
      } catch {
        // Swallow listener errors to avoid breaking the save pipeline.
      }
    }
  }
}
