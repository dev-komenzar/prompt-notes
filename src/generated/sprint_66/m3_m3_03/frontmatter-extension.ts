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
// module:editor — Production entry-point extension
//
// OQ-002 Resolution: StateField + Decoration is the recommended approach.
//
// Decision rationale (documented for ADR trail):
//   • Frontmatter decoration is purely content-dependent — it does not need
//     viewport information or DOM side-effects.
//   • StateField participates in the CodeMirror transaction model, giving
//     stronger consistency guarantees when multiple extensions interact.
//   • ViewPlugin stores state outside the EditorState, which complicates
//     programmatic state inspection and serialisation.
//   • Both approaches have identical runtime cost for this use-case (O(f)
//     per document change, f = frontmatter lines ≈ 3–10).
//   • StateField integrates cleanly with Svelte's onMount/onDestroy lifecycle
//     because it is part of the EditorState configuration — no additional
//     plugin lifecycle to manage.

import type { Extension } from '@codemirror/state';
import { frontmatterStateFieldExtension } from './frontmatter-statefield';
import { frontmatterTheme } from './frontmatter-theme';

/**
 * Complete frontmatter decoration extension for CodeMirror 6.
 *
 * Combines the StateField-based decoration logic with the accompanying
 * light/dark theme.  Drop this into the CodeMirror `extensions` array
 * alongside `@codemirror/lang-markdown` to get automatic background-colour
 * highlighting of the YAML frontmatter block.
 *
 * @example
 * ```ts
 * import { EditorView } from '@codemirror/view';
 * import { EditorState } from '@codemirror/state';
 * import { markdown } from '@codemirror/lang-markdown';
 * import { frontmatterDecoration } from './frontmatter-extension';
 *
 * const view = new EditorView({
 *   state: EditorState.create({
 *     doc: '---\ntags: []\n---\n\nHello',
 *     extensions: [markdown(), frontmatterDecoration()],
 *   }),
 *   parent: document.getElementById('editor')!,
 * });
 * ```
 */
export function frontmatterDecoration(): Extension {
  return [
    frontmatterStateFieldExtension(),
    frontmatterTheme(),
  ];
}
