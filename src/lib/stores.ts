import { writable, derived } from 'svelte/store';
import type { NoteEntry, Config } from './types';

export type ViewName = 'editor' | 'grid' | 'settings';

export interface ToastMessage {
  id: number;
  level: 'info' | 'error' | 'success';
  message: string;
  timeout: number;
}

export const currentView = writable<ViewName>("grid");

export const currentFilename = writable<string | null>(null);

export const config = writable<Config>({ notes_dir: "" });

export const notes = writable<NoteEntry[]>([]);

export const loading = writable<boolean>(false);

export const searchQuery = writable<string>("");

export const selectedTags = writable<string[]>([]);

export const allTags = writable<string[]>([]);

let toastIdCounter = 0;
export const toasts = writable<ToastMessage[]>([]);

export function addToast(
  level: ToastMessage["level"],
  message: string,
  timeout: number = 4000
) {
  const id = ++toastIdCounter;
  toasts.update((t) => [...t, { id, level, message, timeout }]);
  if (timeout > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, timeout);
  }
}

export function dismissToast(id: number) {
  toasts.update((t) => t.filter((msg) => msg.id !== id));
}

export const isEditorView = derived(currentView, ($v) => $v === "editor");

export function openNote(filename: string) {
  currentFilename.set(filename);
  currentView.set("editor");
}

export function newNote() {
  currentFilename.set(null);
  currentView.set("editor");
}

export function goToGrid() {
  currentView.set("grid");
}

export function goToSettings() {
  currentView.set("settings");
}
