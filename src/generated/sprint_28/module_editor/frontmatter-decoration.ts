// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 28 | Task 28-1 | module:editor
// Traceability: detail:editor_clipboard §4.2, design:system-design §2.3.1
// KEY DELIVERABLE: CodeMirror 6 StateField + Decoration for frontmatter background color.
// Implements CONV-1 (frontmatter領域は背景色で視覚的に区別必須).

import { type Range, type EditorState, StateField } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import { detectFrontmatterRange } from './frontmatter-utils';

const frontmatterLineMark = Decoration.line({ class: 'cm-frontmatter-line' });

/**
 * Builds a DecorationSet that applies `.cm-frontmatter-line` to every line
 * within a valid YAML frontmatter block (opening `---` through closing `---`).
 *
 * If frontmatter is absent or incomplete (no closing delimiter), returns
 * Decoration.none so that no background color is applied (partial state per
 * the state-transition diagram in detail:editor_clipboard §2.3).
 */
function buildDecorations(state: EditorState): DecorationSet {
  const range = detectFrontmatterRange(state.doc);
  if (!range) return Decoration.none;

  const ranges: Range<Decoration>[] = [];
  for (let lineNum = range.startLine; lineNum <= range.endLine; lineNum++) {
    const line = state.doc.line(lineNum);
    ranges.push(frontmatterLineMark.range(line.from));
  }

  return Decoration.set(ranges, true);
}

/**
 * StateField that tracks the frontmatter region and provides line decorations.
 * Recomputes only when the document content changes, keeping overhead minimal.
 * Frontmatter is always at document start so scan cost is O(frontmatter lines).
 */
export const frontmatterDecorationField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },

  update(value, tr) {
    if (!tr.docChanged) return value;
    return buildDecorations(tr.state);
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});
