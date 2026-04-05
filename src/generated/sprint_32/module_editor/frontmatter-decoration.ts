// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §4.2, §2.3 state diagram
// CONV: frontmatter region must be visually distinguished by background color.

import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

/**
 * Line decoration applied to each line within the frontmatter block.
 * CSS variable allows theme/dark-mode switching.
 */
const frontmatterLineDecoration = Decoration.line({
  class: "cm-frontmatter-line",
});

/**
 * Detects the frontmatter range (opening `---` to closing `---`) in the document.
 * Returns [startLine, endLine] (0-based line numbers) or null if no valid frontmatter.
 */
function detectFrontmatterRange(
  doc: { lines: number; line: (n: number) => { text: string } }
): [number, number] | null {
  if (doc.lines < 1) return null;
  const firstLine = doc.line(1).text;
  if (firstLine.trim() !== "---") return null;

  for (let i = 2; i <= doc.lines; i++) {
    const lineText = doc.line(i).text;
    if (lineText.trim() === "---") {
      return [1, i];
    }
  }
  return null;
}

/**
 * Builds decoration set for the frontmatter region.
 */
function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const range = detectFrontmatterRange(view.state.doc);

  if (range !== null) {
    const [startLine, endLine] = range;
    for (let i = startLine; i <= endLine; i++) {
      const line = view.state.doc.line(i);
      builder.add(line.from, line.from, frontmatterLineDecoration);
    }
  }

  return builder.finish();
}

/**
 * CodeMirror 6 ViewPlugin that applies background color decoration
 * to the frontmatter region (lines between opening and closing `---`).
 *
 * Performance: Only scans from document start; frontmatter is always at top,
 * so scan is O(n) where n = frontmatter line count (typically < 10).
 */
export const frontmatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

/**
 * CSS theme for frontmatter background.
 * Inject this as a style or use EditorView.theme.
 */
export const FRONTMATTER_CSS = `.cm-frontmatter-line {
  background-color: var(--frontmatter-bg, rgba(59, 130, 246, 0.08));
}`;
