// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:editor_clipboard (CONV-4)
// CodeMirror 6 keymap extension for Mod-n (Cmd+N macOS / Ctrl+N Linux).
// Mod prefix auto-resolves to Cmd on macOS and Ctrl on Linux.

import { keymap, type Command } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

export type CreateNoteHandler = () => void | Promise<void>;

export function createNoteKeymap(onCreateNote: CreateNoteHandler): Extension {
  const command: Command = () => {
    onCreateNote();
    return true;
  };

  return keymap.of([
    { key: 'Mod-n', run: command, preventDefault: true },
  ]);
}
