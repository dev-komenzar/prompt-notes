import { invoke } from "@tauri-apps/api/core";

export interface NoteMetadata {
  filename: string;
  path: string;
  created_at: string;
  tags: string[];
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
  notes_dir: string;
}

export interface TauriCommandError {
  code: string;
  message: string;
}

export function parseError(e: unknown): TauriCommandError {
  if (typeof e === "object" && e !== null && "code" in e) {
    return e as TauriCommandError;
  }
  if (typeof e === "string") {
    try {
      return JSON.parse(e) as TauriCommandError;
    } catch {
      return { code: "UNKNOWN", message: e };
    }
  }
  return { code: "UNKNOWN", message: String(e) };
}

export async function createNote(): Promise<NoteMetadata> {
  return invoke<NoteMetadata>("create_note");
}

export async function saveNote(filename: string, content: string): Promise<NoteMetadata> {
  return invoke<NoteMetadata>("save_note", { filename, content });
}

export async function deleteNote(filename: string): Promise<void> {
  await invoke("delete_note", { filename });
}

export async function forceDeleteNote(filename: string): Promise<void> {
  await invoke("force_delete_note", { filename });
}

export async function readNote(filename: string): Promise<{ content: string; tags: string[] }> {
  return invoke("read_note", { filename });
}

export async function listNotes(options: {
  from_date?: string | null;
  to_date?: string | null;
  tags?: string[];
  limit?: number;
  offset?: number;
} = {}): Promise<ListNotesResult> {
  return invoke("list_notes", {
    from_date: options.from_date ?? null,
    to_date: options.to_date ?? null,
    tags: options.tags ?? [],
    limit: options.limit ?? 100,
    offset: options.offset ?? 0,
  });
}

export async function searchNotes(options: {
  query: string;
  from_date?: string | null;
  to_date?: string | null;
  tags?: string[];
  limit?: number;
  offset?: number;
}): Promise<SearchNotesResult> {
  return invoke("search_notes", {
    query: options.query,
    from_date: options.from_date ?? null,
    to_date: options.to_date ?? null,
    tags: options.tags ?? [],
    limit: options.limit ?? 100,
    offset: options.offset ?? 0,
  });
}

export async function listAllTags(): Promise<string[]> {
  return invoke("list_all_tags");
}

export async function moveNotes(old_notes_dir: string, new_notes_dir: string): Promise<{ moved: number; skipped: number }> {
  return invoke("move_notes", { old_notes_dir, new_notes_dir });
}

export async function getConfig(): Promise<AppConfig> {
  return invoke("get_config");
}

export async function setConfig(notes_dir: string): Promise<void> {
  await invoke("set_config", { notes_dir });
}

export async function copyToClipboard(text: string): Promise<void> {
  await invoke("copy_to_clipboard", { text });
}
