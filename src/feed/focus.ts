import { writable } from "svelte/store";

export const focusedIndex = writable<number | null>(null);
