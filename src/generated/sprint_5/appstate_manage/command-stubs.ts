// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-2
// @task-title: `AppState` の `manage()` 登録
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/component_architecture.md
// @task: 5-2 AppState の manage() 登録
// @module: module:shell

import type { NoteMetadata, Frontmatter, NoteData } from '../project_initialization/types/note';
import type { Settings } from '../project_initialization/types/settings';
import type { SearchParams } from '../project_initialization/types/search';
import type {
  CreateNoteResult,
  OperationResult,
  NoteListResult,
  UpdateSettingsResult,
} from '../project_initialization/types/commands';

/**
 * Stub signatures for the 8 #[tauri::command] handlers registered
 * in generate_handler![].
 *
 * These mirror the Rust command function signatures defined in
 * src-tauri/src/commands/ and registered via:
 *
 *   tauri::Builder::default()
 *       .manage(AppState::new())
 *       .invoke_handler(tauri::generate_handler![
 *           create_note,
 *           save_note,
 *           read_note,
 *           list_notes,
 *           search_notes,
 *           delete_note,
 *           get_settings,
 *           update_settings,
 *       ])
 */

export type CreateNoteHandler = () => Promise<CreateNoteResult>;

export type SaveNoteHandler = (
  filename: string,
  frontmatter: Frontmatter,
  body: string,
) => Promise<OperationResult>;

export type ReadNoteHandler = (
  filename: string,
) => Promise<NoteData>;

export type ListNotesHandler = (
  days?: number,
  tags?: string[],
  dateFrom?: string,
  dateTo?: string,
) => Promise<NoteListResult>;

export type SearchNotesHandler = (
  query?: string,
  tags?: string[],
  dateFrom?: string,
  dateTo?: string,
) => Promise<NoteListResult>;

export type DeleteNoteHandler = (
  filename: string,
) => Promise<OperationResult>;

export type GetSettingsHandler = () => Promise<Settings>;

export type UpdateSettingsHandler = (
  notesDir: string,
) => Promise<UpdateSettingsResult>;

export interface CommandHandlerMap {
  create_note: CreateNoteHandler;
  save_note: SaveNoteHandler;
  read_note: ReadNoteHandler;
  list_notes: ListNotesHandler;
  search_notes: SearchNotesHandler;
  delete_note: DeleteNoteHandler;
  get_settings: GetSettingsHandler;
  update_settings: UpdateSettingsHandler;
}

export const REGISTERED_COMMANDS = [
  'create_note',
  'save_note',
  'read_note',
  'list_notes',
  'search_notes',
  'delete_note',
  'get_settings',
  'update_settings',
] as const;

export type RegisteredCommand = (typeof REGISTERED_COMMANDS)[number];
