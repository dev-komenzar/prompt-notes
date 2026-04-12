// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: editor
// CodeMirror 6 is the only permitted editor engine (RBC-2).
// Markdown syntax highlighting only — no rendering/preview (RBC-2).
// Frontmatter region must be visually distinct via background color (RBC-2).

import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet, keymap, lineWrapping } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';

/** Background color decorations for the frontmatter block (---...---). */
function buildFrontmatterPlugin(): Extension {
  const frontmatterBg = Decoration.line({ class: 'cm-frontmatter-line' });

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const doc = view.state.doc;
        const text = doc.toString();

        if (!text.startsWith('---\n')) return Decoration.none;

        const endIdx = text.indexOf('\n---\n', 4);
        if (endIdx === -1) return Decoration.none;

        const fmEnd = endIdx + 4; // include closing ---
        const decorations: ReturnType<typeof Decoration.line>[] = [];

        for (let pos = 0; pos <= fmEnd; ) {
          const line = doc.lineAt(pos);
          decorations.push(frontmatterBg.range(line.from));
          if (line.to >= fmEnd) break;
          pos = line.to + 1;
        }

        return Decoration.set(decorations, true);
      }
    },
    { decorations: (v) => v.decorations }
  );
}

const frontmatterTheme = EditorView.theme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, #f0f4f8)',
  },
  '&': { height: '100%', fontSize: '14px' },
  '.cm-content': { fontFamily: 'monospace', padding: '16px' },
  '.cm-scroller': { overflow: 'auto' },
});

export function buildEditorExtensions(onDocChanged: () => void): Extension[] {
  return [
    markdown(),
    syntaxHighlighting(defaultHighlightStyle),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    lineWrapping,
    buildFrontmatterPlugin(),
    frontmatterTheme,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDocChanged();
      }
    }),
  ];
}

export function createEditorState(doc: string, extensions: Extension[]): EditorState {
  return EditorState.create({ doc, extensions });
}
