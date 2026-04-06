// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=editor
// CodeMirror 6 extension factories for module:editor.
// CONV-1 (editor): CodeMirror 6 mandatory; Markdown syntax highlight only (no rendering).
// CONV-2 (editor): No title input field.
// CONV-3 (editor): 1-click copy button is core UX (handled in component, not here).
// CONV-4 (editor): Cmd+N / Ctrl+N for instant new note creation.

import {
  type Extension,
  type EditorState,
  StateField,
  RangeSet,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type ViewUpdate,
  keymap,
} from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { FRONTMATTER_LINE_CLASS } from "./constants";

/**
 * Creates the Markdown language extension with syntax highlighting.
 * Uses @codemirror/lang-markdown (CONV-1 compliance).
 * No HTML rendering / preview is attached.
 */
export function markdownExtension(): Extension {
  return markdown();
}

// ---------------------------------------------------------------------------
// Frontmatter background decoration (CONV-1: visually distinguish frontmatter)
// ---------------------------------------------------------------------------

const frontmatterLineDeco = Decoration.line({ class: FRONTMATTER_LINE_CLASS });

/**
 * Computes line decorations for the frontmatter region.
 * Scans from line 1; if it starts with "---", searches for closing "---".
 * Applies background-color decoration to all lines in range.
 */
function computeFrontmatterDecorations(state: EditorState): DecorationSet {
  const doc = state.doc;
  if (doc.lines === 0) return Decoration.none;

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== "---") return Decoration.none;

  const decorations: ReturnType<typeof frontmatterLineDeco.range>[] = [];
  decorations.push(frontmatterLineDeco.range(firstLine.from));

  for (let i = 2; i <= doc.lines; i++) {
    const line = doc.line(i);
    decorations.push(frontmatterLineDeco.range(line.from));
    if (line.text.trim() === "---") {
      // Found closing delimiter; stop decorating
      break;
    }
  }

  return RangeSet.of(decorations);
}

/**
 * StateField-based frontmatter decoration extension.
 * Recomputes on every document change.
 * Performance: O(n) where n = frontmatter lines (typically < 10).
 */
export const frontmatterDecorationField: Extension = StateField.define<DecorationSet>({
  create(state) {
    return computeFrontmatterDecorations(state);
  },
  update(decos, tr) {
    if (tr.docChanged) {
      return computeFrontmatterDecorations(tr.state);
    }
    return decos;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

// ---------------------------------------------------------------------------
// Auto-save update listener
// ---------------------------------------------------------------------------

/**
 * Creates an EditorView.updateListener extension that calls the provided
 * callback whenever the document content changes.
 *
 * The callback is expected to be a debounced save function.
 *
 * @param onDocChange - Called with the full document text when content changes.
 */
export function autoSaveListener(
  onDocChange: (content: string) => void,
): Extension {
  return EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged) {
      const content = update.state.doc.toString();
      onDocChange(content);
    }
  });
}

// ---------------------------------------------------------------------------
// Cmd+N / Ctrl+N new note keybinding (CONV-4)
// ---------------------------------------------------------------------------

/**
 * Creates a keymap extension for new note creation.
 * "Mod-n" maps to Cmd+N on macOS and Ctrl+N on Linux.
 *
 * @param handler - Async function to invoke create_note and reset the editor.
 *                  Should call createNote() from api.ts and update EditorView.
 */
export function newNoteKeymap(handler: () => boolean | void): Extension {
  return keymap.of([
    {
      key: "Mod-n",
      run: () => {
        handler();
        return true; // Prevent default browser behavior
      },
    },
  ]);
}

// ---------------------------------------------------------------------------
// Combined extension set
// ---------------------------------------------------------------------------

/**
 * Assembles all CodeMirror 6 extensions required by module:editor.
 *
 * @param onDocChange - Debounced auto-save callback
 * @param onNewNote - Handler for Cmd+N / Ctrl+N
 */
export function createEditorExtensions(
  onDocChange: (content: string) => void,
  onNewNote: () => boolean | void,
): Extension[] {
  return [
    markdownExtension(),
    frontmatterDecorationField,
    autoSaveListener(onDocChange),
    newNoteKeymap(onNewNote),
  ];
}
