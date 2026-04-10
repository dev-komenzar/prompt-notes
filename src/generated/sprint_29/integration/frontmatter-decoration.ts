// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: CodeMirror 6 `ViewPlugin` として `---` 〜 `---` 範囲に `.cm-frontmatter-bg` CSS クラスを `Decoration.line()` で適用。CSS: `background-color: rgba(59, 130, 246, 0.08)` を `src
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:task 29-1 frontmatter-decoration ViewPlugin
import { Decoration, EditorView, ViewPlugin, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import type { Range } from '@codemirror/state';

const frontmatterLineDeco = Decoration.line({ class: 'cm-frontmatter-bg' });

function buildDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;
  const text = doc.toString();

  if (!text.startsWith('---\n')) return Decoration.none;

  const endIndex = text.indexOf('\n---\n', 4);
  if (endIndex === -1) return Decoration.none;

  // endIndex is position of the '\n' preceding the closing '---'
  // closing '---' line starts at endIndex + 1
  const closingLinePos = endIndex + 1;
  const ranges: Range<typeof frontmatterLineDeco>[] = [];

  for (let pos = 0; pos < closingLinePos; ) {
    const line = doc.lineAt(pos);
    ranges.push(frontmatterLineDeco.range(line.from));
    pos = line.to + 1;
  }

  const closingLine = doc.lineAt(closingLinePos);
  ranges.push(frontmatterLineDeco.range(closingLine.from));

  return Decoration.set(ranges);
}

export function frontmatterDecoration() {
  return ViewPlugin.fromClass(
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
    { decorations: (v) => v.decorations },
  );
}
