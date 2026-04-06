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
// module:editor — Theme definitions for frontmatter background color
//
// CSS variable `--frontmatter-bg` allows host applications / Svelte components
// to override the background colour without touching the extension.
// Two base themes are registered: one for light mode and one for dark mode.
// CodeMirror 6 automatically activates the correct theme variant.

import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

/**
 * Light-mode base theme for the `.cm-frontmatter-line` class.
 * Uses a subtle blue tint as specified in editor_clipboard_design §4.2.
 */
export const frontmatterLightTheme: Extension = EditorView.baseTheme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, rgba(59, 130, 246, 0.08))',
  },
});

/**
 * Dark-mode theme variant.  Slightly higher opacity for legibility
 * on dark backgrounds.
 */
export const frontmatterDarkTheme: Extension = EditorView.theme(
  {
    '.cm-frontmatter-line': {
      backgroundColor: 'var(--frontmatter-bg, rgba(96, 165, 250, 0.12))',
    },
  },
  { dark: true },
);

/**
 * Combined light + dark theme extension.
 * CodeMirror applies the appropriate variant based on the active theme.
 */
export function frontmatterTheme(): Extension {
  return [frontmatterLightTheme, frontmatterDarkTheme];
}
