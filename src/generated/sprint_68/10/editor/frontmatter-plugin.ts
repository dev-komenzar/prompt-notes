// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 68-1
// @task-title: 10 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { ViewPlugin, Decoration, EditorView } from '@codemirror/view';
import type { ViewUpdate, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const frontmatterLineDeco = Decoration.line({ class: 'cm-frontmatter-line' });

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  const text = doc.toString();

  if (!text.startsWith('---\n')) return builder.finish();

  const closeIdx = text.indexOf('\n---', 4);
  if (closeIdx === -1) return builder.finish();

  const frontmatterEndPos = closeIdx + 4;

  for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    if (line.from > frontmatterEndPos) break;
    builder.add(line.from, line.from, frontmatterLineDeco);
  }

  return builder.finish();
}

export const frontmatterPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

export const frontmatterTheme = EditorView.theme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, #f0f4f8)',
  },
});
