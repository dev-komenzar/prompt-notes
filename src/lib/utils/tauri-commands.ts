import { invoke } from "@tauri-apps/api/core";

export interface NoteMetadata {
  filename: string;
  title: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  body_preview: string;
}

export interface ListNotesResult {
  notes: NoteMetadata[];
  total_count: number;
}

export interface SearchResultEntry {
  metadata: NoteMetadata;
  matched_line: string;
  line_number: number;
}

export interface SearchNotesResult {
  results: SearchResultEntry[];
  total_count: number;
}

export interface AppConfig {
  notes_directory: string;
}

export async function createNote(tags: string[]): Promise<NoteMetadata> {
  return invoke<NoteMetadata>("create_note", { tags });
}

export async function saveNote(
  filename: string,
  rawContent: string
): Promise<NoteMetadata> {
  return invoke<NoteMetadata>("save_note", { filename, rawContent });
}

export async function readNote(filename: string): Promise<string> {
  return invoke<string>("read_note", { filename });
}

export async function listNotes(
  offset: number,
  limit: number,
  tags?: string[],
  fromDate?: string,
  toDate?: string
): Promise<ListNotesResult> {
  return invoke<ListNotesResult>("list_notes", {
    offset,
    limit,
    tags,
    fromDate,
    toDate,
  });
}

export async function searchNotes(
  query: string,
  offset: number,
  limit: number
): Promise<SearchNotesResult> {
  return invoke<SearchNotesResult>("search_notes", { query, offset, limit });
}

export async function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("get_config");
}

export async function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>("set_config", { newConfig: config });
}

export async function moveNotes(
  fromDir: string,
  toDir: string
): Promise<number> {
  return invoke<number>("move_notes", { fromDir, toDir });
}

export async function trashNote(filename: string): Promise<void> {
  return invoke<void>("trash_note", { filename });
}

export async function forceDeleteNote(filename: string): Promise<void> {
  return invoke<void>("force_delete_note", { filename });
}

export async function copyToClipboard(text: string): Promise<void> {
  return invoke<void>("copy_to_clipboard", { text });
}

export async function readFromClipboard(): Promise<string> {
  return invoke<string>("read_from_clipboard");
}
