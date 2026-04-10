// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `read_note` でノート読み込み → CodeMirror にセット → 自動保存有効化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=35 task=35-1 module=editor
import { EditorView } from '@codemirror/view';
import { saveNote, parseFrontmatterAndBody } from './editor-loader';

const DEBOUNCE_MS = 750;

export function createAutoSaveExtension(filename: string) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return EditorView.updateListener.of((update) => {
    if (!update.docChanged) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const doc = update.view.state.doc.toString();
      const { frontmatter, body } = parseFrontmatterAndBody(doc);
      try {
        await saveNote(filename, frontmatter, body);
      } catch (err) {
        console.error('[autosave] save_note failed:', err);
      }
    }, DEBOUNCE_MS);
  });
}
