// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:traceability sprint=31 task=31-1 module=editor
// CodeMirror 6 editor configuration: assembles all extensions required by module:editor.
//   - Markdown syntax highlighting (@codemirror/lang-markdown) — CONV-1
//   - Frontmatter background decoration — CONV-1
//   - Mod-n keymap for new note creation — CONV-4 / AC-ED-04
//   - updateListener for auto-save trigger — CONV-AUTOSAVE
//   - No Markdown rendering/preview (prohibited by RBC-2)

import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  drawSelection,
  highlightActiveLine,
  type ViewUpdate,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { bracketMatching } from '@codemirror/language';
import {
  frontmatterDecorationPlugin,
  frontmatterBaseTheme,
} from './frontmatter-decoration';
import { getBodyStartOffset } from './frontmatter-utils';

export interface EditorCallbacks {
  onDocChanged: (update: ViewUpdate) => void;
  onCreateNote: () => void;
}

export function buildEditorExtensions(callbacks: EditorCallbacks): Extension[] {
  return [
    lineNumbers(),
    history(),
    drawSelection(),
    highlightActiveLine(),
    bracketMatching(),
    keymap.of([
      {
        key: 'Mod-n',
        run: () => {
          callbacks.onCreateNote();
          return true;
        },
        preventDefault: true,
      },
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    markdown(),
    frontmatterDecorationPlugin,
    frontmatterBaseTheme,
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        callbacks.onDocChanged(update);
      }
    }),
    EditorView.lineWrapping,
  ];
}

export function createEditorState(doc: string, extensions: Extension[]): EditorState {
  return EditorState.create({ doc, extensions });
}

export function mountEditorView(state: EditorState, parent: HTMLElement): EditorView {
  return new EditorView({ state, parent });
}

export function replaceDocContent(view: EditorView, content: string): void {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: content },
  });
}

export function focusEditorBody(view: EditorView): void {
  const content = view.state.doc.toString();
  const cursorPos = getBodyStartOffset(content);
  view.dispatch({ selection: { anchor: cursorPos } });
  view.focus();
}
