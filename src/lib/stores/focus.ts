import { writable } from "svelte/store";

export const editorFocused = writable<boolean>(false);
