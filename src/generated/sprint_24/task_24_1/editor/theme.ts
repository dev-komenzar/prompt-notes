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

// PromptNotes — CodeMirror 6 Theme Extension
// Provides CSS styles for frontmatter decoration and editor appearance.
// Uses CSS variables for easy dark mode / theme switching.

import { EditorView } from '@codemirror/view';
import { FRONTMATTER_BG_VAR, FRONTMATTER_BG_DEFAULT, CM_FRONTMATTER_LINE_CLASS } from '../constants';

/**
 * CodeMirror 6 theme extension providing frontmatter background styling.
 *
 * The frontmatter region is visually distinguished by a subtle background color.
 * Override the CSS variable --frontmatter-bg at the host element level to customize.
 *
 * Usage in Editor.svelte:
 *   import { promptnotesTheme } from './editor/theme';
 *   extensions: [ promptnotesTheme, ... ]
 */
export const promptnotesTheme = EditorView.baseTheme({
  [`.${CM_FRONTMATTER_LINE_CLASS}`]: {
    backgroundColor: `var(${FRONTMATTER_BG_VAR}, ${FRONTMATTER_BG_DEFAULT})`,
  },
  '&': {
    height: '100%',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-content': {
    fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  '.cm-focused': {
    outline: 'none',
  },
});
