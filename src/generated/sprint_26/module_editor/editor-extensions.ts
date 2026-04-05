// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:26 | task:26-1 | module:editor
// Assembles the full CodeMirror 6 extension array used by EditorController.
// CONV: CodeMirror 6 必須。Markdownシンタックスハイライトのみ（レンダリング禁止）。
// CONV: Cmd+N / Ctrl+N で即座に新規ノート作成しフォーカス移動必須。

import type { Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  highlightActiveLine,
} from '@codemirror/view';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import {
  frontmatterDecorationPlugin,
  frontmatterTheme,
} from './frontmatter-decoration';

/**
 * Callbacks the extension set will invoke in response to editor events.
 * Implementations are provided by EditorController.
 */
export interface EditorCallbacks {
  /** Fired when the document content has changed (for auto-save). */
  onDocChanged(): void;
  /** Fired when Mod-n (Cmd+N / Ctrl+N) is pressed. */
  onCreateNote(): void;
}

/**
 * Build the complete CodeMirror 6 extension array.
 *
 * Extensions included:
 *   • Undo / redo history
 *   • Default + history keymaps, plus Mod-n for new-note creation
 *   • Markdown language mode (syntax highlighting only — no rendering)
 *   • Frontmatter background-colour decoration
 *   • Active-line highlight
 *   • Line wrapping
 *   • Document-change listener for auto-save
 */
export function createEditorExtensions(
  callbacks: EditorCallbacks,
): Extension[] {
  return [
    history(),
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
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    frontmatterDecorationPlugin,
    frontmatterTheme,
    highlightActiveLine(),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        callbacks.onDocChanged();
      }
    }),
  ];
}
