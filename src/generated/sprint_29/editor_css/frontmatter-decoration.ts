// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-4
// @task-title: editor.css` に定義。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { ViewPlugin, Decoration, type DecorationSet, EditorView } from '@codemirror/view';

const frontmatterLineDeco = Decoration.line({ class: 'cm-frontmatter-bg' });

export function frontmatterDecoration() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }

      update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );
}

function buildDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc.toString();
  if (!doc.startsWith('---\n')) return Decoration.none;

  const endIndex = doc.indexOf('\n---\n', 4);
  if (endIndex === -1) return Decoration.none;

  const endPos = endIndex + 4;
  const ranges: ReturnType<typeof frontmatterLineDeco.range>[] = [];

  for (let pos = 0; pos <= endPos; ) {
    const line = view.state.doc.lineAt(pos);
    ranges.push(frontmatterLineDeco.range(line.from));
    if (line.to + 1 > pos) {
      pos = line.to + 1;
    } else {
      break;
    }
  }

  return Decoration.set(ranges);
}
