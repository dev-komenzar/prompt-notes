import { writable } from "svelte/store";
import type { SearchResultEntry } from "../shell/tauri-commands";

export const searchResults = writable<SearchResultEntry[] | null>(null);
