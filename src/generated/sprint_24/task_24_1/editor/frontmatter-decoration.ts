// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — CodeMirror 6 Frontmatter Background Decoration
// Applies background color to the YAML frontmatter region (--- delimited block)
// for visual distinction from body text.
// Detection logic runs on every document change; performance impact is negligible
// since frontmatter is always at document start (O(n) where n = frontmatter lines, typically <10).

import { EditorView, ViewPlugin, Decoration, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { FRONTMATTER_DELIMITER, CM_FRONTMATTER_LINE_CLASS } from '../constants';

const frontmatterLineDeco = Decoration.line({ class: CM_FRONTMATTER_LINE_CLASS });

/**
 * Compute line decorations for the frontmatter block.
 * Scans from line 1 (document start) for opening `---`,
 * then marks all lines through the closing `---` with background styling.
 */
function computeFrontmatterDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  if (doc.lines === 0) {
    return builder.finish();
  }

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== FRONTMATTER_DELIMITER) {
    return builder.finish();
  }

  // Opening delimiter found — decorate it
  builder.add(firstLine.from, firstLine.from, frontmatterLineDeco);

  // Scan for closing delimiter
  for (let lineNum = 2; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    builder.add(line.from, line.from, frontmatterLineDeco);

    if (line.text.trim() === FRONTMATTER_DELIMITER) {
      // Closing delimiter found — stop decorating
      break;
    }
  }

  return builder.finish();
}

/**
 * CodeMirror 6 ViewPlugin that decorates frontmatter lines with a background color.
 * Recalculates decorations on every document change.
 *
 * Usage in Editor.svelte:
 *   import { frontmatterDecorationPlugin } from './editor/frontmatter-decoration';
 *   extensions: [ frontmatterDecorationPlugin, ... ]
 */
export const frontmatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = computeFrontmatterDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged) {
        this.decorations = computeFrontmatterDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);
