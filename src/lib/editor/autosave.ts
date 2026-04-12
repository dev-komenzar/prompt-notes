import { EditorView } from '@codemirror/view';
import { debounce } from '../debounce';

export type SaveCallback = (content: string) => void;

export function autosaveExtension(onSave: SaveCallback) {
  const debouncedSave = debounce((content: string) => {
    onSave(content);
  }, 500);

  return EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const content = update.state.doc.toString();
      debouncedSave(content);
    }
  });
}
