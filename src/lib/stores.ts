// Sprint 12 – Svelte stores for global application state
import { writable, derived } from "svelte/store";
import type { ViewName, Config, NoteEntry, ToastMessage } from "./types";

/** Current active view for SPA routing */
export const currentView = writable<ViewName>("grid");

/** Currently open note filename (null = no note open) */
export const currentFilename = writable<string | null>(null);

/** Application configuration */
export const config = writable<Config>({
  notes_directory: "",
  default_filter_days: 7,
});

/** Notes loaded for grid view */
export const notes = writable<NoteEntry[]>([]);

/** Whether notes are currently loading */
export const loading = writable<boolean>(false);

/** Search query for grid view */
export const searchQuery = writable<string>("");

/** Selected tags for filtering */
export const selectedTags = writable<string[]>([]);

/** All available tags */
export const allTags = writable<string[]>([]);

/** Toast notification queue */
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

/** Derived: whether we're in editor mode */
export const isEditorView = derived(currentView, ($v) => $v === "editor");

/** Navigate to editor with a specific file */
export function openNote(filename: string) {
  currentFilename.set(filename);
  currentView.set("editor");
}

/** Navigate to editor for a new note (no filename) */
export function newNote() {
  currentFilename.set(null);
  currentView.set("editor");
}

/** Navigate back to grid */
export function goToGrid() {
  currentView.set("grid");
}
