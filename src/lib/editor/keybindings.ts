import { keymap } from '@codemirror/view';
import type { KeyBinding } from '@codemirror/view';

export type KeybindingAction = () => boolean;

/**
 * Create a Cmd+N / Ctrl+N keybinding for new note creation.
 */
export function newNoteKeyBinding(action: KeybindingAction): KeyBinding[] {
  return [
    {
      key: 'Mod-n',
      run: () => {
        return action();
      }
    }
  ];
}

/**
 * Creates a keymap extension for the editor.
 */
export function editorKeymap(actions: { newNote: KeybindingAction }) {
  return keymap.of(newNoteKeyBinding(actions.newNote));
}
