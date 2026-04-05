// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:editor_clipboard (CONV-1)
// CodeMirror 6 ViewPlugin that applies a background-color Decoration
// to frontmatter lines (--- delimited YAML block at document start).
// This is a visual-only decoration; YAML data parsing is Rust-side only.

import {
  EditorView,
  ViewPlugin,
  Decoration,
  type ViewUpdate,
  type DecorationSet,
} from '@codemirror/view';

const frontmatterLineDecoration = Decoration.line({
  class: 'cm-frontmatter-line',
});

function buildDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;

  if (doc.lines < 1) {
    return Decoration.none;
  }

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') {
    return Decoration.none;
  }

  let closingLineNumber = -1;
  const maxScan = Math.min(doc.lines, 50); // frontmatter is short
  for (let i = 2; i <= maxScan; i++) {
    if (doc.line(i).text.trim() === '---') {
      closingLineNumber = i;
      break;
    }
  }

  if (closingLineNumber === -1) {
    return Decoration.none;
  }

  const decorations: ReturnType<typeof frontmatterLineDecoration.range>[] = [];
  for (let i = 1; i <= closingLineNumber; i++) {
    decorations.push(frontmatterLineDecoration.range(doc.line(i).from));
  }

  return Decoration.set(decorations);
}

export const frontmatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (instance) => instance.decorations,
  },
);

export const frontmatterBaseTheme = EditorView.baseTheme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, rgba(59, 130, 246, 0.08))',
  },
});
