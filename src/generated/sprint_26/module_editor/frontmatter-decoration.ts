// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:26 | task:26-1 | module:editor
// CodeMirror 6 ViewPlugin that applies a background-color line decoration
// to the YAML frontmatter region (--- … ---) at the top of the document.
// CONV: frontmatter領域は背景色で視覚的に区別必須。

import {
  type DecorationSet,
  Decoration,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';

const frontmatterLineMark = Decoration.line({
  class: 'cm-frontmatter-line',
});

function computeDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc;
  if (doc.lines === 0) return Decoration.none;

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') return Decoration.none;

  const ranges: ReturnType<typeof frontmatterLineMark.range>[] = [];
  ranges.push(frontmatterLineMark.range(firstLine.from));

  for (let lineNum = 2; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    ranges.push(frontmatterLineMark.range(line.from));
    if (line.text.trim() === '---') {
      // Closing delimiter found — return the complete decoration set.
      return Decoration.set(ranges, true);
    }
  }

  // Closing delimiter not yet typed (partial frontmatter).
  // Decorate what we have so the user still sees the visual cue.
  return Decoration.set(ranges, true);
}

/**
 * ViewPlugin that maintains a DecorationSet highlighting frontmatter lines.
 * Recomputes only when the document content changes.
 */
export const frontmatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = computeDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = computeDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);

/**
 * Base theme that styles the frontmatter background.
 * Override the CSS custom property `--frontmatter-bg` to adjust the colour
 * or to respond to dark-mode / light-mode changes at the application level.
 */
export const frontmatterTheme = EditorView.baseTheme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, rgba(59, 130, 246, 0.08))',
  },
});
