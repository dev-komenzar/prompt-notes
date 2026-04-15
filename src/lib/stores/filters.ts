import { writable } from "svelte/store";
import { dateToFilenamePrefix } from "$lib/utils/timestamp";

export interface FiltersState {
  fromDate: string;
  toDate: string;
  tags: string[];
  query: string;
}

function defaults(): FiltersState {
  const now = new Date();
  const ago = new Date(now);
  ago.setDate(ago.getDate() - 7);
  ago.setHours(0, 0, 0, 0);
  return {
    fromDate: dateToFilenamePrefix(ago),
    toDate: dateToFilenamePrefix(now),
    tags: [],
    query: "",
  };
}

export const filters = writable<FiltersState>(defaults());
