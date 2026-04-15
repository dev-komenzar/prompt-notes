import { writable } from "svelte/store";
import type { NoteMetadata } from "$lib/utils/tauri-commands";

export const notes = writable<NoteMetadata[]>([]);

export function prependNote(item: NoteMetadata) {
  notes.update((prev) => [item, ...prev]);
}

export function removeNote(filename: string) {
  notes.update((prev) => prev.filter((n) => n.filename !== filename));
}

export function updateNote(meta: NoteMetadata) {
  notes.update((prev) => prev.map((n) => (n.filename === meta.filename ? meta : n)));
}
