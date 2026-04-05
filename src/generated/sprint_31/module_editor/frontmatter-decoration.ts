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

// @codd:generated sprint_31 task_31-1 module:editor
// Frontmatter region (--- delimited YAML block) is visually distinguished
// via background color using a CodeMirror 6 ViewPlugin + Decoration.

import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const frontmatterLineDecoration = Decoration.line({
  class: 'cm-frontmatter-line',
});

function buildFrontmatterDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  if (doc.lines === 0) {
    return builder.finish();
  }

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') {
    return builder.finish();
  }

  // Decorate the opening ---
  builder.add(firstLine.from, firstLine.from, frontmatterLineDecoration);

  // Scan for the closing ---
  for (let i = 2; i <= doc.lines; i++) {
    const line = doc.line(i);
    builder.add(line.from, line.from, frontmatterLineDecoration);
    if (line.text.trim() === '---') {
      break;
    }
  }

  return builder.finish();
}

export const frontmatterDecoration = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildFrontmatterDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildFrontmatterDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);
