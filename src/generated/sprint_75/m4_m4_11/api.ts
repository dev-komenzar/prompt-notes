// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 75-1
// @task-title: M4（M4-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint_75 / task 75-1 / M4-11
// IPC wrapper — single entry point for all Tauri invoke calls.
// All file operations route through Rust backend via Tauri IPC.
// Direct filesystem access from frontend is prohibited (CONV-1).

import type {
  NoteEntry,
  ListNotesParams,
  SearchNotesParams,
  ReadNoteParams,
  ReadNoteResult,
  SaveNoteParams,
  CreateNoteResult,
  DeleteNoteParams,
  Config,
  SetConfigParams,
} from './types';

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

let invokeFn: InvokeFn | null = null;

export function setInvokeFunction(fn: InvokeFn): void {
  invokeFn = fn;
}

function getInvoke(): InvokeFn {
  if (!invokeFn) {
    throw new Error(
      'Tauri invoke function not initialized. Call setInvokeFunction() at app startup.',
    );
  }
  return invokeFn;
}

export async function createNote(): Promise<CreateNoteResult> {
  return getInvoke()<CreateNoteResult>('create_note');
}

export async function saveNote(params: SaveNoteParams): Promise<void> {
  await getInvoke()<void>('save_note', {
    filename: params.filename,
    content: params.content,
  });
}

export async function readNote(params: ReadNoteParams): Promise<ReadNoteResult> {
  return getInvoke()<ReadNoteResult>('read_note', {
    filename: params.filename,
  });
}

export async function deleteNote(params: DeleteNoteParams): Promise<void> {
  await getInvoke()<void>('delete_note', {
    filename: params.filename,
  });
}

export async function listNotes(params: ListNotesParams): Promise<NoteEntry[]> {
  return getInvoke()<NoteEntry[]>('list_notes', {
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return getInvoke()<NoteEntry[]>('search_notes', {
    query: params.query,
    from_date: params.from_date,
    to_date: params.to_date,
    tag: params.tag,
  });
}

export async function getConfig(): Promise<Config> {
  return getInvoke()<Config>('get_config');
}

export async function setConfig(params: SetConfigParams): Promise<void> {
  await getInvoke()<void>('set_config', {
    notes_dir: params.notes_dir,
  });
}
