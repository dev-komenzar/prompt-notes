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
// module:editor — ViewPlugin approach (ALTERNATIVE)
//
// Provided for comparison against the StateField approach.
// ViewPlugin is typically preferred when decorations depend on viewport
// visibility or require DOM side-effects.  For content-only decorations
// the StateField approach (frontmatter-statefield.ts) is recommended.

import type { Extension } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type PluginValue,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import { detectFrontmatterRange } from './frontmatter-range';

const FRONTMATTER_LINE_DECO = Decoration.line({
  class: 'cm-frontmatter-line',
});

class FrontmatterPluginValue implements PluginValue {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.build(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged) {
      this.decorations = this.build(update.view);
    }
  }

  private build(view: EditorView): DecorationSet {
    const range = detectFrontmatterRange(view.state.doc);
    if (!range) {
      return Decoration.none;
    }

    const marks: ReturnType<typeof FRONTMATTER_LINE_DECO.range>[] = [];
    for (let ln = range.startLine; ln <= range.endLine; ln++) {
      marks.push(
        FRONTMATTER_LINE_DECO.range(view.state.doc.line(ln).from),
      );
    }

    return Decoration.set(marks, /* sort */ false);
  }
}

/**
 * A `ViewPlugin` that maintains line decorations for the frontmatter block.
 */
export const frontmatterViewPlugin = ViewPlugin.fromClass(
  FrontmatterPluginValue,
  {
    decorations: (plugin) => plugin.decorations,
  },
);

/**
 * Return the ViewPlugin-based frontmatter decoration extension.
 *
 * Use this only if DOM-level side-effects are needed alongside the
 * decoration.  For pure background-color highlighting the StateField
 * approach is preferred.
 */
export function frontmatterViewPluginExtension(): Extension {
  return frontmatterViewPlugin;
}
