// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-2
// @task-title: lang-markdown`（シンタックスハイライト）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import {
  ViewPlugin,
  Decoration,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from '@codemirror/view';
import type { Extension } from '@codemirror/state';

const frontmatterLineDeco = Decoration.line({ class: 'cm-frontmatter-bg' });

class FrontmatterDecorationPlugin {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildDecorations(update.view);
    }
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const doc = view.state.doc.toString();

  if (!doc.startsWith('---\n')) {
    return Decoration.none;
  }

  const endIndex = doc.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return Decoration.none;
  }

  // Include the closing '---' line itself
  const endPos = endIndex + 4; // position after '\n---'

  const widgets: ReturnType<typeof frontmatterLineDeco.range>[] = [];
  for (let pos = 0; pos <= endPos; ) {
    const line = view.state.doc.lineAt(pos);
    widgets.push(frontmatterLineDeco.range(line.from));
    if (line.to + 1 > endPos) break;
    pos = line.to + 1;
  }

  return Decoration.set(widgets);
}

/**
 * Returns a CodeMirror 6 extension that applies the `.cm-frontmatter-bg`
 * CSS class to every line within the YAML frontmatter block (--- ... ---).
 * Satisfies NNC-E1: frontmatter must be visually distinguished by background color.
 */
export function frontmatterDecoration(): Extension {
  return ViewPlugin.fromClass(FrontmatterDecorationPlugin, {
    decorations: (v) => v.decorations,
  });
}
