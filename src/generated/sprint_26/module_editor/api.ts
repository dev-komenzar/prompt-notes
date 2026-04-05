// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:26 | task:26-1 | module:editor
// Single entry-point for all Tauri IPC invoke calls consumed by module:editor.
// Direct use of @tauri-apps/api invoke in components is prohibited;
// all IPC traffic flows through these typed wrappers.

import { invoke } from '@tauri-apps/api/core';
import type { CreateNoteResponse, ReadNoteResponse } from './types';

export async function createNote(): Promise<CreateNoteResponse> {
  return invoke<CreateNoteResponse>('create_note');
}

export async function saveNote(
  filename: string,
  content: string,
): Promise<void> {
  return invoke<void>('save_note', { filename, content });
}

export async function readNote(filename: string): Promise<ReadNoteResponse> {
  return invoke<ReadNoteResponse>('read_note', { filename });
}

export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}
