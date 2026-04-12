import { keymap, type KeyBinding } from '@codemirror/view';

export type KeybindingAction = () => boolean;

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

export function editorKeymap(actions: { newNote: KeybindingAction }) {
  return keymap.of(newNoteKeyBinding(actions.newNote));
}
