import { writable } from "svelte/store";
import type { SearchResultEntry } from "$lib/utils/tauri-commands";

export const searchResults = writable<SearchResultEntry[] | null>(null);
