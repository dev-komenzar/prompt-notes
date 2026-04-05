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

// Sprint 27 – module:editor – Base theme for frontmatter background colour
// Uses CSS custom property --frontmatter-bg for easy theming / dark-mode support.

import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

/**
 * Base theme providing the `.cm-frontmatter-line` background.
 * Override `--frontmatter-bg` in your application CSS to adjust the colour.
 */
export const frontmatterTheme: Extension = EditorView.baseTheme({
  '.cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg, rgba(59, 130, 246, 0.08))',
    borderRadius: '0',
  },
  '&dark .cm-frontmatter-line': {
    backgroundColor: 'var(--frontmatter-bg-dark, rgba(96, 165, 250, 0.12))',
  },
});
