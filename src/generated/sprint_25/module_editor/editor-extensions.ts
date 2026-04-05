// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 25-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:25 task:25-1 module:editor – Assembles all CodeMirror 6 extensions
// Sprint packages: @codemirror/view, @codemirror/state, @codemirror/lang-markdown
// CONV-5: Markdown syntax highlight only (NO rendering/preview).
// CONV-6: No title input field—editor is body-only.
// CONV-24: CodeMirror 6 is the confirmed editor engine.

import { EditorView, keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import {
  defaultKeymap,
  history,
  historyKeymap,
} from '@codemirror/commands';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';

import { frontmatterDecoration } from './frontmatter-decoration';
import { autoSaveExtension, type AutoSaveConfig } from './auto-save-extension';
import { createNoteKeymap } from './create-note-keymap';

export interface EditorExtensionsConfig {
  getFilename: () => string | null;
  onDocChanged: (filename: string, content: string) => void;
  onCreateNote: (view: import('@codemirror/view').EditorView) => void;
}

export function createEditorExtensions(
  config: EditorExtensionsConfig,
): Extension[] {
  const autoSave: AutoSaveConfig = {
    getFilename: config.getFilename,
    onDocChanged: config.onDocChanged,
  };

  return [
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    markdown(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    frontmatterDecoration(),
    autoSaveExtension(autoSave),
    createNoteKeymap(config.onCreateNote),
    EditorView.lineWrapping,
  ];
}
