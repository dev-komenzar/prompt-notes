// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md
// Sprint 21 — frontmatter 背景色 ViewPlugin + Decoration

import {
  ViewPlugin,
  Decoration,
  EditorView,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const FRONTMATTER_OPEN = '---\n';
const FRONTMATTER_CLOSE = '\n---\n';

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;
  const text = doc.toString();

  if (!text.startsWith(FRONTMATTER_OPEN)) {
    return builder.finish();
  }

  const rest = text.slice(FRONTMATTER_OPEN.length);
  const closingIdx = rest.indexOf(FRONTMATTER_CLOSE);
  if (closingIdx === -1) {
    return builder.finish();
  }

  // frontmatter end position: opening "---\n" + content + "\n---\n"
  const frontmatterEnd =
    FRONTMATTER_OPEN.length + closingIdx + FRONTMATTER_CLOSE.length - 1;
  const endLine = doc.lineAt(frontmatterEnd);
  const bgDecoration = Decoration.line({ class: 'cm-frontmatter-line' });

  for (let lineNum = 1; lineNum <= endLine.number; lineNum++) {
    const line = doc.line(lineNum);
    builder.add(line.from, line.from, bgDecoration);
  }

  return builder.finish();
}

export const frontmatterPlugin = ViewPlugin.fromClass(
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

export const frontmatterTheme = EditorView.theme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, #f0f4f8)',
  },
});

/**
 * ドキュメント先頭の frontmatter ブロックを除いた本文を返す。
 * クリップボードコピーおよび save_note 呼び出しで使用する。
 */
export function extractBody(doc: string): string {
  const match = doc.match(/^---\n[\s\S]*?\n---\n?/);
  return match ? doc.slice(match[0].length) : doc;
}
