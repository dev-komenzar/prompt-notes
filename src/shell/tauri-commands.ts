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

export interface HighlightRange {
  start: number;
  end: number;
}

export interface SearchResultEntry {
  metadata: NoteMetadata;
  snippet: string;
  highlights: HighlightRange[];
}

export interface SearchNotesResult {
  entries: SearchResultEntry[];
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

export interface ListNotesParams {
  fromDate?: string | null;
  toDate?: string | null;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export async function listNotes(params: ListNotesParams): Promise<ListNotesResult> {
  return invoke<ListNotesResult>("list_notes", {
    offset: params.offset ?? 0,
    limit: params.limit ?? 100,
    tags: params.tags && params.tags.length > 0 ? params.tags : undefined,
    fromDate: params.fromDate ?? undefined,
    toDate: params.toDate ?? undefined,
  });
}

export interface SearchNotesParams {
  query: string;
  fromDate?: string | null;
  toDate?: string | null;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export async function searchNotes(params: SearchNotesParams): Promise<SearchNotesResult> {
  return invoke<SearchNotesResult>("search_notes", {
    query: params.query,
    offset: params.offset ?? 0,
    limit: params.limit ?? 100,
    fromDate: params.fromDate ?? undefined,
    toDate: params.toDate ?? undefined,
    tags: params.tags && params.tags.length > 0 ? params.tags : undefined,
  });
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

export async function listAllTags(): Promise<string[]> {
  return invoke<string[]>("list_all_tags");
}
