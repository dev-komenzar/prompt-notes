import { writable } from "svelte/store";

export interface AppConfigState {
  notes_dir: string;
}

export const config = writable<AppConfigState>({ notes_dir: "" });
