// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: detail:component_architecture, design:system-design
// Tauri v2 — IPC command name constants and type mapping

import type {
  CreateNoteResult,
  ReadNoteResult,
  NoteEntry,
  Config,
  ListNotesArgs,
  SearchNotesArgs,
  SaveNoteArgs,
  NoteFilenameArgs,
  SetConfigArgs,
} from './types';

/**
 * Exhaustive enum of all IPC command names exposed by Rust backend via #[tauri::command].
 * Used as the single source of truth for invoke() calls in api.ts.
 *
 * Ownership:
 *   - create_note, save_note, read_note, delete_note, list_notes, search_notes → module:storage
 *   - get_config, set_config → module:settings
 *   - All dispatched through module:shell
 */
export const IPC_COMMANDS = {
  CREATE_NOTE: 'create_note',
  SAVE_NOTE: 'save_note',
  READ_NOTE: 'read_note',
  DELETE_NOTE: 'delete_note',
  LIST_NOTES: 'list_notes',
  SEARCH_NOTES: 'search_notes',
  GET_CONFIG: 'get_config',
  SET_CONFIG: 'set_config',
} as const;

export type IpcCommandName = (typeof IPC_COMMANDS)[keyof typeof IPC_COMMANDS];

/**
 * Type-level mapping: command name → { args, result }.
 * Ensures compile-time safety for invoke wrappers in api.ts.
 */
export interface IpcCommandMap {
  [IPC_COMMANDS.CREATE_NOTE]: { args: Record<string, never>; result: CreateNoteResult };
  [IPC_COMMANDS.SAVE_NOTE]: { args: SaveNoteArgs; result: void };
  [IPC_COMMANDS.READ_NOTE]: { args: NoteFilenameArgs; result: ReadNoteResult };
  [IPC_COMMANDS.DELETE_NOTE]: { args: NoteFilenameArgs; result: void };
  [IPC_COMMANDS.LIST_NOTES]: { args: ListNotesArgs; result: NoteEntry[] };
  [IPC_COMMANDS.SEARCH_NOTES]: { args: SearchNotesArgs; result: NoteEntry[] };
  [IPC_COMMANDS.GET_CONFIG]: { args: Record<string, never>; result: Config };
  [IPC_COMMANDS.SET_CONFIG]: { args: SetConfigArgs; result: void };
}
