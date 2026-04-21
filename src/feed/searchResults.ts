import { writable } from "svelte/store";
import type { SearchResultEntry } from "$lib/shell/tauri-commands";

export const searchResults = writable<SearchResultEntry[] | null>(null);
