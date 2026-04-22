import { writable } from "svelte/store";
import type { NoteMetadata } from "$lib/shell/tauri-commands";
import {
  listNotes as listNotesCmd,
  searchNotes as searchNotesCmd,
} from "$lib/shell/tauri-commands";
import { filters } from "./filters";
import { searchResults } from "./searchResults";
import { totalCount } from "./totalCount";
import { handleCommandError } from "$lib/shell/error-handler";
import { get } from "svelte/store";

export const notes = writable<NoteMetadata[]>([]);

const PAGE_SIZE = 100;

export async function loadNotes(): Promise<void> {
  try {
    const f = get(filters);
    const result = await listNotesCmd({
      offset: 0,
      limit: PAGE_SIZE,
      tags: f.tags.length > 0 ? f.tags : undefined,
      fromDate: f.fromDate,
      toDate: f.toDate,
    });
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
    const result = await listNotesCmd({
      offset: current.length,
      limit: PAGE_SIZE,
      tags: f.tags.length > 0 ? f.tags : undefined,
      fromDate: f.fromDate,
      toDate: f.toDate,
    });
    notes.update((list) => [...list, ...result.notes]);
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
    const f = get(filters);
    const result = await searchNotesCmd({
      query,
      offset: 0,
      limit: PAGE_SIZE,
      fromDate: f.fromDate,
      toDate: f.toDate,
      tags: f.tags.length > 0 ? f.tags : undefined,
    });
    searchResults.set(result.entries);
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
