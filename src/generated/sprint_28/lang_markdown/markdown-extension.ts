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

import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { keymap, EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { frontmatterDecoration } from './frontmatter-decoration';

/**
 * Builds the markdown-specific extension set for CodeMirror 6.
 * Includes: lang-markdown syntax highlighting, history, defaultKeymap,
 * historyKeymap, lineWrapping, and frontmatter decoration.
 * HTML rendering (<h1>, <strong>, etc.) is explicitly excluded per NNC-E1.
 */
export function buildMarkdownExtensions(): Extension[] {
  return [
    markdown({ base: markdownLanguage }),
    syntaxHighlighting(defaultHighlightStyle),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    frontmatterDecoration(),
  ];
}
