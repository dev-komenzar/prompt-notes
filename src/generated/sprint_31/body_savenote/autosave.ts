// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-3
// @task-title: body 分離後に `saveNote()` を呼び出し。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md
// @sprint: 31, task: 31-3

import { EditorView } from '@codemirror/view';
import { parseFrontmatterAndBody } from '../500ms_1000ms_docchanged_frontmatter/frontmatter';
import { invoke } from '@tauri-apps/api/core';

const DEBOUNCE_MS = 750;

async function saveNote(
  filename: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> {
  await invoke('save_note', { filename, frontmatter, body });
}

export function createAutoSaveExtension(filename: string) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const doc = update.view.state.doc.toString();
      const { frontmatter, body } = parseFrontmatterAndBody(doc);
      await saveNote(filename, frontmatter, body);
    }, DEBOUNCE_MS);
  });
}
