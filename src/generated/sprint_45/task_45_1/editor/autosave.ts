// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 45-1
// @task-title: 担当モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-traceability: detail:editor_clipboard § 4.2, detail:component_architecture § 4.5
// Autosave pipeline: 500ms debounce, single save path for body and frontmatter changes.

import { saveNote } from '../ipc';

export function createAutosave(onError?: (err: unknown) => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function schedule(
    noteId: string,
    getTags: () => string[],
    getBody: () => string,
  ): void {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(async () => {
      timer = null;
      try {
        await saveNote(noteId, { tags: getTags() }, getBody());
      } catch (err) {
        onError?.(err);
      }
    }, 500);
  }

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { schedule, cancel };
}
