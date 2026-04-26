import { writable, get } from "svelte/store";
import { notes } from "./notes";

export const focusedIndex = writable<number | null>(null);

// Keep focusedIndex in bounds when notes are removed
let previousLength = 0;

notes.subscribe(
  ($notes) => {
    const len = $notes.length;
    if (len < previousLength) {
      const idx = get(focusedIndex);
      if (idx !== null) {
        if (len === 0) {
          focusedIndex.set(null);
        } else if (idx >= len) {
          focusedIndex.set(len - 1);
        }
      }
    }
    previousLength = len;
  }
);
