// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `tauri::Builder` 初期化
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// sprint: 5, task: 5-1, module: shell

import { invoke } from '@tauri-apps/api/core';
import { TauriCommands } from '../types/commands';
import type { CreateNoteResult, Frontmatter, NoteData, NoteMetadata, OperationResult } from '../types/note';
import type { SearchParams } from '../types/search';

/**
 * IPC abstraction layer for note-related commands.
 * All file operations go through Rust backend via Tauri IPC.
 * Direct filesystem access from frontend is prohibited (NNC-1).
 */

export async function createNote(): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>(TauriCommands.CREATE_NOTE);
}

export async function saveNote(
  filename: string,
  frontmatter: Frontmatter,
  body: string,
): Promise<OperationResult> {
  return invoke<OperationResult>(TauriCommands.SAVE_NOTE, {
    filename,
    frontmatter,
    body,
  });
}

export async function readNote(filename: string): Promise<NoteData> {
  return invoke<NoteData>(TauriCommands.READ_NOTE, { filename });
}

export async function listNotes(params?: {
  days?: number;
  tags?: string[];
  date_from?: string;
  date_to?: string;
}): Promise<{ notes: NoteMetadata[] }> {
  return invoke<{ notes: NoteMetadata[] }>(TauriCommands.LIST_NOTES, params ?? {});
}

export async function searchNotes(params: SearchParams): Promise<{ notes: NoteMetadata[] }> {
  return invoke<{ notes: NoteMetadata[] }>(TauriCommands.SEARCH_NOTES, {
    query: params.query ?? null,
    tags: params.tags ?? null,
    date_from: params.date_from ?? null,
    date_to: params.date_to ?? null,
  });
}

export async function deleteNote(filename: string): Promise<OperationResult> {
  return invoke<OperationResult>(TauriCommands.DELETE_NOTE, { filename });
}
