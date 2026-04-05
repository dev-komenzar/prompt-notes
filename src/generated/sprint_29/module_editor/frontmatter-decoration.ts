// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// CoDD trace: detail:editor_clipboard §4.2
// CONV-5: frontmatter region must be visually distinguished by background color.
// Implementation uses ViewPlugin + Decoration (resolves OQ-002 in favour of
// ViewPlugin for its simpler lifecycle management with Svelte onMount/onDestroy).

import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  EditorView,
  type ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const frontmatterLineDecoration = Decoration.line({
  class: 'cm-frontmatter-line',
});

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  if (doc.lines < 1) return builder.finish();

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') return builder.finish();

  builder.add(firstLine.from, firstLine.from, frontmatterLineDecoration);

  for (let lineNum = 2; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    builder.add(line.from, line.from, frontmatterLineDecoration);
    if (line.text.trim() === '---') {
      break;
    }
  }

  return builder.finish();
}

/**
 * CodeMirror 6 ViewPlugin that applies a background-color decoration to
 * the YAML frontmatter block (`---` delimited region at the start of the
 * document). Re-computes on every document or viewport change.
 *
 * Performance: The scan is bounded by the number of frontmatter lines
 * (typically < 10), so overhead is negligible even on large documents.
 */
export const frontmatterDecoration = ViewPlugin.fromClass(
  class FrontmatterPlugin {
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
    decorations: (plugin) => plugin.decorations,
  },
);

/**
 * Base theme providing the default frontmatter background colour.
 * Override the CSS variable `--frontmatter-bg` for dark-mode or custom themes.
 */
export const frontmatterTheme = EditorView.baseTheme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, rgba(59, 130, 246, 0.08))',
  },
});
