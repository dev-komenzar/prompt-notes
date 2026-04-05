// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — CodeMirror 6 ViewPlugin: frontmatter background-color decoration.
// Convention: frontmatter region MUST be visually distinguished via background color.
// Uses ViewPlugin approach for lightweight per-update decoration rebuild.

import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  EditorView,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import type { Extension } from '@codemirror/state';

const frontmatterLineMark = Decoration.line({ class: 'cm-frontmatter-line' });

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  if (doc.lines < 1) return builder.finish();

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') return builder.finish();

  let closingLineNum = -1;
  const scanLimit = Math.min(doc.lines, 100); // frontmatter is near the top
  for (let i = 2; i <= scanLimit; i++) {
    if (doc.line(i).text.trim() === '---') {
      closingLineNum = i;
      break;
    }
  }

  if (closingLineNum === -1) return builder.finish();

  for (let i = 1; i <= closingLineNum; i++) {
    const line = doc.line(i);
    builder.add(line.from, line.from, frontmatterLineMark);
  }

  return builder.finish();
}

class FrontmatterDecorationPlugin {
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

export const frontmatterDecorationPlugin: Extension = ViewPlugin.fromClass(
  FrontmatterDecorationPlugin,
  { decorations: (v) => v.decorations },
);

/**
 * Base theme providing the default frontmatter background colour.
 * Consumers may override via CSS variable --frontmatter-bg.
 */
export const frontmatterTheme: Extension = EditorView.baseTheme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, rgba(59, 130, 246, 0.08))',
  },
});
