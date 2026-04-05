// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 34-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:34 task:34-1 module:editor
// CoDD trace: detail:editor_clipboard → plan:implementation_plan
// Convention 5: frontmatter領域は背景色で視覚的に区別必須。
// Implementation uses StateField + Decoration (OQ-002 resolution).

import { EditorView, Decoration } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { StateField, RangeSetBuilder } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';

const frontmatterLineMark = Decoration.line({
  class: 'cm-frontmatter-line',
});

function computeDecorations(state: EditorState): DecorationSet {
  const doc = state.doc;
  const builder = new RangeSetBuilder<Decoration>();

  if (doc.length === 0) return Decoration.none;

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') return Decoration.none;

  let endLineNumber = -1;
  const maxScan = Math.min(doc.lines, 100);
  for (let i = 2; i <= maxScan; i++) {
    if (doc.line(i).text.trim() === '---') {
      endLineNumber = i;
      break;
    }
  }

  if (endLineNumber === -1) return Decoration.none;

  for (let i = 1; i <= endLineNumber; i++) {
    const line = doc.line(i);
    builder.add(line.from, line.from, frontmatterLineMark);
  }

  return builder.finish();
}

export const frontmatterDecorationField = StateField.define<DecorationSet>({
  create(state) {
    return computeDecorations(state);
  },
  update(_, tr) {
    if (!tr.docChanged) return computeDecorations(tr.startState);
    return computeDecorations(tr.state);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

export const frontmatterTheme = EditorView.baseTheme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, rgba(59, 130, 246, 0.08))',
  },
});

/**
 * Returns the CM6 extensions for frontmatter background decoration.
 * Applies background color to lines within the --- delimited YAML block.
 */
export function frontmatterDecoration() {
  return [frontmatterDecorationField, frontmatterTheme];
}
