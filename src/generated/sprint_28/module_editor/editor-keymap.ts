// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 28 | Task 28-1 | module:editor
// Traceability: detail:editor_clipboard §4.4, test:acceptance_criteria AC-ED-04
// Cmd+N (macOS) / Ctrl+N (Linux) new note creation keymap.
// Uses CM6 "Mod" prefix which maps to Cmd on macOS and Ctrl on Linux.

import { keymap } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import type { CreateNoteResult } from './types';
import { createNote } from './api';
import { createFrontmatterTemplate, getBodyStartOffset } from './frontmatter-utils';

export type OnNoteCreated = (result: CreateNoteResult) => void;

/**
 * Creates a keymap extension that binds Mod-n to new note creation.
 *
 * @param onNoteCreated - Optional callback invoked after note is created and
 *   editor content is replaced. Receives the CreateNoteResult from the backend.
 * @param setCurrentFilename - Callback to update the currently-active filename
 *   in the parent component's state, required for autosave to target the correct file.
 */
export function newNoteKeymap(
  setCurrentFilename: (filename: string) => void,
  onNoteCreated?: OnNoteCreated,
) {
  return keymap.of([
    {
      key: 'Mod-n',
      run(view: EditorView): boolean {
        handleCreateNote(view, setCurrentFilename, onNoteCreated);
        return true;
      },
    },
  ]);
}

async function handleCreateNote(
  view: EditorView,
  setCurrentFilename: (filename: string) => void,
  onNoteCreated?: OnNoteCreated,
): Promise<void> {
  const result = await createNote();
  setCurrentFilename(result.filename);

  const template = createFrontmatterTemplate();
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: template,
    },
  });

  const bodyOffset = getBodyStartOffset(view.state.doc);
  view.dispatch({
    selection: { anchor: bodyOffset },
  });
  view.focus();

  onNoteCreated?.(result);
}
