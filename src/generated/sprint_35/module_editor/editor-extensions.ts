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

// module:editor — CodeMirror 6 extension bundle.
// Assembles: Markdown syntax highlighting, frontmatter decoration,
// auto-save update listener, Mod-n keymap, and basic editing amenities.
// No Markdown rendering/preview — convention prohibits it.
// No title input field — convention prohibits it.

import { type Extension } from '@codemirror/state';
import { EditorView, keymap, drawSelection, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { bracketMatching, indentOnInput } from '@codemirror/language';

import { frontmatterDecorationPlugin, frontmatterTheme } from './frontmatter-decoration';

export interface EditorCallbacks {
  /** Invoked when the document content changes. Receives the full document string. */
  onDocChange: (content: string) => void;
  /**
   * Invoked when Mod-n (Cmd+N / Ctrl+N) is pressed.
   * The handler MUST be fire-and-forget safe (async errors handled internally).
   */
  onNewNote: () => void;
}

/**
 * Build the full set of CodeMirror 6 extensions for the PromptNotes editor.
 *
 * Includes:
 *  • Markdown syntax highlighting (@codemirror/lang-markdown) — CONV-2 mandatory
 *  • Frontmatter background decoration — CONV-1 mandatory
 *  • Mod-n new-note keymap — CONV-4 mandatory
 *  • Auto-save update listener — CONV-AUTOSAVE mandatory
 *  • history + default keymaps
 *  • Line wrapping, active-line highlight, draw-selection
 */
export function createEditorExtensions(callbacks: EditorCallbacks): Extension[] {
  return [
    // --- Editing amenities ---
    history(),
    drawSelection(),
    highlightActiveLine(),
    bracketMatching(),
    indentOnInput(),
    EditorView.lineWrapping,

    // --- Keymaps (order matters: custom before defaults) ---
    keymap.of([
      {
        key: 'Mod-n',
        run: () => {
          callbacks.onNewNote();
          return true; // Prevent browser default (new window).
        },
        preventDefault: true,
      },
    ]),
    keymap.of(historyKeymap),
    keymap.of(defaultKeymap),

    // --- Markdown syntax highlighting (rendering/preview prohibited) ---
    markdown(),

    // --- Frontmatter visual distinction ---
    frontmatterDecorationPlugin,
    frontmatterTheme,

    // --- Auto-save trigger ---
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        callbacks.onDocChange(update.state.doc.toString());
      }
    }),
  ];
}
