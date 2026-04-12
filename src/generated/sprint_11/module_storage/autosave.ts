// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=11 module:storage — debounced auto-save pipeline
// 500ms debounce after docChanged; no explicit save button or Ctrl+S (CONV-3).
// Atomic write is handled by Rust backend (save_note uses write+rename).

import { saveNote } from './ipc';

export interface AutoSaveState {
  noteId: string | null;
  timer: ReturnType<typeof setTimeout> | null;
  pendingBody: string;
  pendingTags: string[];
}

export function createAutoSave(debounceMs = 500) {
  let noteId: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function setNote(id: string): void {
    cancel();
    noteId = id;
  }

  function schedule(tags: string[], body: string): void {
    cancel();
    if (!noteId) return;
    const id = noteId;
    timer = setTimeout(async () => {
      timer = null;
      await saveNote(id, { tags }, body);
    }, debounceMs);
  }

  function flush(tags: string[], body: string): Promise<void> {
    cancel();
    if (!noteId) return Promise.resolve();
    return saveNote(noteId, { tags }, body);
  }

  function destroy(): void {
    cancel();
    noteId = null;
  }

  return { setNote, schedule, flush, destroy };
}
