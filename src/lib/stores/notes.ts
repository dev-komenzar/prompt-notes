import { writable } from "svelte/store";
import type { NoteMetadata } from "$lib/utils/tauri-commands";
import {
  listNotes as listNotesCmd,
  searchNotes as searchNotesCmd,
} from "$lib/utils/tauri-commands";
import { filters } from "./filters";
import { searchResults } from "./searchResults";
import { totalCount } from "./totalCount";
import { handleCommandError } from "$lib/utils/error-handler";
import { get } from "svelte/store";

export const notes = writable<NoteMetadata[]>([]);

const PAGE_SIZE = 50;

export async function loadNotes(): Promise<void> {
  try {
    const f = get(filters);
    const result = await listNotesCmd(
      0,
      PAGE_SIZE,
      f.tags.length > 0 ? f.tags : undefined,
      f.fromDate ?? undefined,
      f.toDate ?? undefined
    );
    notes.set(result.notes);
    totalCount.set(result.total_count);
    searchResults.set(null);
  } catch (error) {
    handleCommandError(error);
  }
}

export async function loadMoreNotes(): Promise<void> {
  try {
    const f = get(filters);
    const current = get(notes);
    const result = await listNotesCmd(
      current.length,
      PAGE_SIZE,
      f.tags.length > 0 ? f.tags : undefined,
      f.fromDate ?? undefined,
      f.toDate ?? undefined
    );
    notes.update((list) => [...list, ...result.notes]);
    totalCount.set(result.total_count);
  } catch (error) {
    handleCommandError(error);
  }
}

export async function loadOlderNotes(): Promise<void> {
  try {
    const f = get(filters);
    const result = await listNotesCmd(
      0,
      500,
      f.tags.length > 0 ? f.tags : undefined,
      "1970-01-01",
      "9999-12-31"
    );
    notes.set(result.notes);
    totalCount.set(result.total_count);
  } catch (error) {
    handleCommandError(error);
  }
}

export async function searchNotesAction(query: string): Promise<void> {
  if (!query.trim()) {
    searchResults.set(null);
    await loadNotes();
    return;
  }
  try {
    const result = await searchNotesCmd(query, 0, PAGE_SIZE);
    searchResults.set(result.results);
    totalCount.set(result.total_count);
  } catch (error) {
    handleCommandError(error);
  }
}

export function prependNote(note: NoteMetadata): void {
  notes.update((list) => [note, ...list]);
  totalCount.update((n) => n + 1);
}

export function removeNote(filename: string): void {
  notes.update((list) => list.filter((n) => n.filename !== filename));
  totalCount.update((n) => Math.max(0, n - 1));
}

export function updateNote(updated: NoteMetadata): void {
  notes.update((list) =>
    list.map((n) => (n.filename === updated.filename ? updated : n))
  );
}
