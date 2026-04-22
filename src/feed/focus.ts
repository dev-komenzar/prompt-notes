import { get, writable } from "svelte/store";
import { notes } from "./notes";

export const focusedIndex = writable<number | null>(null);

// Keep focus valid when notes shrink (e.g. after delete).
// - 0 notes → null
// - focused index out of range → last index
// - focused index still in range → unchanged
let previousLength = 0;
notes.subscribe(($notes) => {
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
});
