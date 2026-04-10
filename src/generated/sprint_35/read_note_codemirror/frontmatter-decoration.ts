// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `read_note` でノート読み込み → CodeMirror にセット → 自動保存有効化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:sprint=35 task=35-1 module=editor
// NNC-E1: frontmatter region must be visually distinguished via background color
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
    { decorations: (v) => v.decorations },
  );
}

function buildDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc.toString();
  if (!doc.startsWith('---\n')) return Decoration.none;
  const endIndex = doc.indexOf('\n---\n', 4);
  if (endIndex === -1) return Decoration.none;

  // Decorate all lines from document start through and including the closing '---' line.
  // endIndex points to the '\n' before '---'; closing line starts at endIndex+1.
  // endPos = endIndex + 1 (start of '---') + 3 ('---') + 1 ('\n') = endIndex + 5
  const endPos = endIndex + 5;
  const ranges: ReturnType<typeof frontmatterLineDeco.range>[] = [];

  for (let pos = 0; pos < endPos; ) {
    const line = view.state.doc.lineAt(pos);
    ranges.push(frontmatterLineDeco.range(line.from));
    pos = line.to + 1;
  }

  return Decoration.set(ranges);
}
