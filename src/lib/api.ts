// Sprint 3/15/25 – Tauri IPC wrapper functions
// All file operations go through Rust backend via invoke()
import { invoke } from "@tauri-apps/api/core";
import type {
  NoteEntry,
  CreateNoteResult,
  ListNotesParams,
  SearchNotesParams,
  Config,
} from "./types";

/** Create a new note with optional initial content and tags */
export async function createNote(
  content?: string,
  tags?: string[]
): Promise<CreateNoteResult> {
  return invoke<CreateNoteResult>("create_note", { content, tags });
}

/** Save/overwrite content to an existing note */
export async function saveNote(
  filename: string,
  content: string
): Promise<void> {
  return invoke("save_note", { filename, content });
}

/** Read the full content of a note */
export async function readNote(filename: string): Promise<string> {
  return invoke<string>("read_note", { filename });
}

/** Delete a note by filename */
export async function deleteNote(filename: string): Promise<void> {
  return invoke("delete_note", { filename });
}

/** List notes with optional date/tag filters */
export async function listNotes(
  params?: ListNotesParams
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("list_notes", { params: params ?? {} });
}

/** Full-text search across notes */
export async function searchNotes(
  params: SearchNotesParams
): Promise<NoteEntry[]> {
  return invoke<NoteEntry[]>("search_notes", { params });
}

/** Get application configuration */
export async function getConfig(): Promise<Config> {
  return invoke<Config>("get_config");
}

/** Update application configuration */
export async function setConfig(config: Partial<Config>): Promise<void> {
  return invoke("set_config", { config });
}

/** Get all unique tags across all notes */
export async function getAllTags(): Promise<string[]> {
  return invoke<string[]>("get_all_tags");
}
