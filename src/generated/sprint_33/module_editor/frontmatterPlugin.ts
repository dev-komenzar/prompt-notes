// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md §3.3
// CodeMirror 6 ViewPlugin that applies a background-color decoration to every
// line inside the leading ---...--- frontmatter block.
// Usage: include in the EditorState extensions array when the CM6 document
// contains the full note text (frontmatter + body). Not activated when the
// editor shows body-only content.

import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// CSS class injected by EditorView.theme — caller must define the colour.
const DECO_CLASS = 'cm-frontmatter-line';

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  // Read only the first 4 KiB to avoid scanning large documents.
  const head = doc.sliceString(0, Math.min(doc.length, 4096));
  if (!head.startsWith('---\n')) return builder.finish();

  const closingIdx = head.indexOf('\n---\n', 4);
  if (closingIdx === -1) return builder.finish();

  // Decorate lines 1 … N where N is the line containing the closing '---'.
  const closingLine = doc.lineAt(closingIdx + 1);
  const lineDeco = Decoration.line({ class: DECO_CLASS });

  for (let n = 1; n <= closingLine.number; n++) {
    const line = doc.line(n);
    builder.add(line.from, line.from, lineDeco);
  }

  return builder.finish();
}

class FrontmatterHighlighter {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

export const frontmatterPlugin = ViewPlugin.fromClass(FrontmatterHighlighter, {
  decorations: (v) => v.decorations,
});
