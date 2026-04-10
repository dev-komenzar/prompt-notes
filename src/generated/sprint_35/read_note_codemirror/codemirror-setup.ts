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
// NNC-E1: CodeMirror 6 required. Markdown highlight only — no rendering.
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { frontmatterDecoration } from './frontmatter-decoration';
import { createAutoSaveExtension } from './autosave';

export interface EditorSetupOptions {
  parent: HTMLElement;
  content: string;
  filename: string;
}

export function createEditorView({ parent, content, filename }: EditorSetupOptions): EditorView {
  const state = EditorState.create({
    doc: content,
    extensions: [
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(defaultHighlightStyle),
      frontmatterDecoration(),
      createAutoSaveExtension(filename),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      history(),
      EditorView.lineWrapping,
    ],
  });
  return new EditorView({ state, parent });
}

/** Replace the full document content without replacing the instance. */
export function setEditorContent(view: EditorView, content: string): void {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
  });
}

/** Position cursor after the frontmatter block and focus. */
export function placeCursorAfterFrontmatter(view: EditorView): void {
  const doc = view.state.doc.toString();
  let cursorPos = 0;
  if (doc.startsWith('---\n')) {
    const end = doc.indexOf('\n---\n', 4);
    if (end !== -1) {
      cursorPos = Math.min(end + 5 + 1, view.state.doc.length);
    }
  }
  view.dispatch({ selection: { anchor: cursorPos } });
  view.focus();
}
