// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: editor,storage
// Auto-save pipeline: debounce 500ms, then invoke save_note via IPC.
// No explicit save button or Cmd+S. This is a release-blocking requirement (CONV-3).

import { saveNote } from '../ipc';

const DEBOUNCE_MS = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

export class AutoSavePipeline {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;

  constructor(
    private readonly onStatusChange: (status: 'idle' | 'saving' | 'saved' | 'error') => void
  ) {}

  schedule(noteId: string, tags: string[], body: string): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(noteId, tags, body), DEBOUNCE_MS);
  }

  private async flush(noteId: string, tags: string[], body: string): Promise<void> {
    this.onStatusChange('saving');
    try {
      await saveNote(noteId, { tags }, body);
      this.retryCount = 0;
      this.onStatusChange('saved');
    } catch (err) {
      this.retryCount++;
      if (this.retryCount <= MAX_RETRIES) {
        setTimeout(() => this.flush(noteId, tags, body), RETRY_DELAY_MS);
      } else {
        this.retryCount = 0;
        this.onStatusChange('error');
        console.error('[autosave] failed after max retries', err);
      }
    }
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
