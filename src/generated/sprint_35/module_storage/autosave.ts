// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-2
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Debounced auto-save pipeline for module:storage.
// All actual file I/O is delegated to Rust via IPC (saveNote).
// Frontend owns debounce control only (CONV-3).

import { saveNote } from '@/generated/sprint_35/module_grid/ipc';

export interface AutoSaveState {
  readonly isSaving: boolean;
  readonly lastSavedAt: Date | null;
  readonly hasUnsavedChanges: boolean;
  readonly error: string | null;
}

export type AutoSaveStateListener = (state: AutoSaveState) => void;

const INITIAL_STATE: AutoSaveState = {
  isSaving: false,
  lastSavedAt: null,
  hasUnsavedChanges: false,
  error: null,
};

export class AutoSaveManager {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private state: AutoSaveState = INITIAL_STATE;
  private readonly listeners = new Set<AutoSaveStateListener>();

  constructor(private readonly debounceMs = 500) {}

  addListener(listener: AutoSaveStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  schedule(noteId: string, tags: string[], body: string): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.setState({ ...this.state, hasUnsavedChanges: true, error: null });
    this.timer = setTimeout(() => {
      this.timer = null;
      this.executeSave(noteId, tags, body);
    }, this.debounceMs);
  }

  async flush(noteId: string, tags: string[], body: string): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.executeSave(noteId, tags, body);
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.state.hasUnsavedChanges) {
      this.setState({ ...this.state, hasUnsavedChanges: false });
    }
  }

  getState(): AutoSaveState {
    return this.state;
  }

  private async executeSave(noteId: string, tags: string[], body: string): Promise<void> {
    this.setState({ ...this.state, isSaving: true, error: null });
    try {
      await saveNote(noteId, { tags }, body);
      this.setState({
        isSaving: false,
        lastSavedAt: new Date(),
        hasUnsavedChanges: false,
        error: null,
      });
    } catch (err) {
      this.setState({
        ...this.state,
        isSaving: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private setState(next: AutoSaveState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}
