// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 66-1
// @task-title: M3（M3-03）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 66 · M3-03 · OQ-002 frontmatter decoration
// module:editor — StateField + Decoration approach (RECOMMENDED)
//
// Rationale: frontmatter decoration depends solely on document content, not on
// viewport geometry. StateField is the idiomatic CodeMirror 6 primitive for
// content-derived state. Decorations are provided to the editor view via the
// `provide` callback, ensuring consistency with the transaction model.

import {
  type EditorState,
  type Extension,
  StateField,
} from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
} from '@codemirror/view';
import { detectFrontmatterRange } from './frontmatter-range';

const FRONTMATTER_LINE_DECO = Decoration.line({
  class: 'cm-frontmatter-line',
});

function computeDecorations(state: EditorState): DecorationSet {
  const range = detectFrontmatterRange(state.doc);
  if (!range) {
    return Decoration.none;
  }

  const marks: ReturnType<typeof FRONTMATTER_LINE_DECO.range>[] = [];
  for (let ln = range.startLine; ln <= range.endLine; ln++) {
    marks.push(FRONTMATTER_LINE_DECO.range(state.doc.line(ln).from));
  }

  // Ranges are already sorted (ascending line order) so sort=false is safe.
  return Decoration.set(marks, /* sort */ false);
}

/**
 * A `StateField` that tracks the set of line decorations covering
 * the YAML frontmatter block.  Rebuilds only when the document changes.
 */
export const frontmatterDecoField = StateField.define<DecorationSet>({
  create(state) {
    return computeDecorations(state);
  },

  update(value, transaction) {
    if (!transaction.docChanged) {
      return value;
    }
    return computeDecorations(transaction.state);
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * Return the StateField-based frontmatter decoration extension.
 *
 * This is the **recommended** approach for OQ-002 because the decoration
 * is purely content-dependent and benefits from the transactional guarantees
 * of the state model.
 */
export function frontmatterStateFieldExtension(): Extension {
  return frontmatterDecoField;
}
