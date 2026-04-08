// Sprint 10/22 – Custom keymaps for CM6 editor
import { keymap } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

/**
 * Creates the Mod-n (Cmd+N / Ctrl+N) keymap for new note creation.
 * The callback should handle creating a new note in the app.
 */
export function newNoteKeymap(onNewNote: () => void): Extension {
  return keymap.of([
    {
      key: "Mod-n",
      run: () => {
        onNewNote();
        return true;
      },
    },
  ]);
}
