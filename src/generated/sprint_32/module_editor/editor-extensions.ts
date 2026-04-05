// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §4.1, §4.4
// CONV: CodeMirror 6 mandatory (CONV-2). No Markdown rendering/preview.

import { keymap } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
import { EditorState, type Extension } from "@codemirror/state";
import { frontmatterDecorationPlugin } from "./frontmatter-decoration";

/**
 * Builds the CodeMirror 6 extension array for the PromptNotes editor.
 *
 * Includes:
 * - Markdown syntax highlighting (@codemirror/lang-markdown) — no rendering
 * - Frontmatter background decoration
 * - Cmd+N / Ctrl+N keybinding for new note creation
 * - EditorView.updateListener for auto-save change detection
 * - Default keymap and history
 *
 * @param onCreateNote - Callback invoked on Mod-n (Cmd+N / Ctrl+N)
 * @param onDocChanged - Callback invoked when document content changes
 */
export function buildEditorExtensions(
  onCreateNote: () => void,
  onDocChanged: (content: string) => void
): Extension[] {
  return [
    history(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      {
        key: "Mod-n",
        run: () => {
          onCreateNote();
          return true;
        },
      },
    ]),
    markdown(),
    frontmatterDecorationPlugin,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDocChanged(update.state.doc.toString());
      }
    }),
    EditorView.lineWrapping,
    EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "14px",
      },
      ".cm-scroller": {
        overflow: "auto",
      },
      ".cm-content": {
        fontFamily: "monospace",
      },
    }),
  ];
}

/**
 * Creates a new EditorState with the given document content and extensions.
 */
export function createEditorState(
  doc: string,
  extensions: Extension[]
): EditorState {
  return EditorState.create({ doc, extensions });
}

export { EditorView };
