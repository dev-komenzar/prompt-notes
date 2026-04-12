// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 21-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md
// Sprint 21 — CodeMirror 6 拡張セット構成

import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { EditorView, keymap, type ViewUpdate } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

export function createEditorExtensions(onDocChanged: () => void): Extension[] {
  return [
    markdown(),
    syntaxHighlighting(defaultHighlightStyle),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onDocChanged();
      }
    }),
    EditorView.theme({
      '&': { height: '100%', fontSize: '14px' },
      '.cm-content': { fontFamily: 'monospace', padding: '16px' },
      '.cm-scroller': { overflow: 'auto' },
      '.cm-focused': { outline: 'none' },
    }),
  ];
}
