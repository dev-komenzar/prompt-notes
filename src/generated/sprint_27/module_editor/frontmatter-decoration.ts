// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 27 – module:editor – OQ-002 Resolution: StateField + Decoration
//
// Decision: Use StateField + Decoration (NOT ViewPlugin) for frontmatter background color.
//
// Rationale:
//   1. Frontmatter range is purely derived from document content—no DOM side-effects needed.
//   2. StateField integrates with CM6's transactional state model: decorations are always
//      consistent after every transaction without manual DOM synchronisation.
//   3. Decoration.provide() cleanly wires the field into the editor's decoration pipeline.
//   4. ViewPlugin is better suited for effects that depend on viewport or DOM measurements;
//      frontmatter detection only needs the document text.
//   5. This approach is framework-agnostic—works identically in Svelte, React, or vanilla JS.
//
// The StateField recomputes decorations only when docChanged is true, keeping overhead minimal.
// Frontmatter is always at document start, so detection is O(f) where f = frontmatter line count
// (typically < 10 lines).

import { StateField, type Extension } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import { detectFrontmatterRange } from './frontmatter-detection';

const frontmatterLineMark = Decoration.line({
  class: 'cm-frontmatter-line',
});

function buildFrontmatterDecorations(state: import('@codemirror/state').EditorState): DecorationSet {
  const range = detectFrontmatterRange(state.doc);
  if (range === null) {
    return Decoration.none;
  }

  const decorations: import('@codemirror/state').Range<Decoration>[] = [];

  for (let lineNum = range.startLine; lineNum <= range.endLine; lineNum++) {
    const line = state.doc.line(lineNum);
    decorations.push(frontmatterLineMark.range(line.from));
  }

  return Decoration.set(decorations, true);
}

/**
 * StateField that tracks the frontmatter region and provides line decorations.
 * Recalculates only on document changes.
 */
const frontmatterField = StateField.define<DecorationSet>({
  create(state) {
    return buildFrontmatterDecorations(state);
  },

  update(value, tr) {
    if (!tr.docChanged) {
      return value;
    }
    return buildFrontmatterDecorations(tr.state);
  },

  provide(field) {
    return EditorView.decorations.from(field);
  },
});

/**
 * CodeMirror 6 extension that decorates frontmatter lines with a background colour.
 * Resolves OQ-002: chosen approach is StateField + Decoration.
 */
export function frontmatterDecoration(): Extension {
  return frontmatterField;
}
