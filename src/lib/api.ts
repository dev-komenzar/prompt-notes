import { invoke } from '@tauri-apps/api/core';
import type {
  NoteEntry,
  Config,
  CreateNoteResult,
  ReadNoteResult,
  ListNotesParams,
  SearchNotesParams,
} from './types';

export async function createNote(body: string, tags: string[]): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>('create_note', { body, tags });
}

export async function saveNote(filename: string, body: string, tags: string[]): Promise<void> {
  return invoke<void>('save_note', { filename, body, tags });
}

export async function readNote(filename: string): Promise<ReadNoteResult> {
  return invoke<ReadNoteResult>('read_note', { filename });
}

export async function listNotes(params: ListNotesParams = {}): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('list_notes', {
    dateFrom: params.date_from,
    dateTo: params.date_to,
    tags: params.tags
  });
}

export async function searchNotes(params: SearchNotesParams): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>('search_notes', {
    query: params.query,
    dateFrom: params.date_from,
    dateTo: params.date_to,
    tags: params.tags
  });
}

export async function deleteNote(filename: string): Promise<void> {
  return invoke<void>('delete_note', { filename });
}

export async function getSettings(): Promise<Config> {
  return invoke<Config>('get_settings');
}

export async function updateSettings(config: Config): Promise<void> {
  return invoke<void>('update_settings', { config });
}
