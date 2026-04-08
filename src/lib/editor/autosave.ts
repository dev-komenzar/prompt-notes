// Sprint 9/21/68 – Auto-save extension for CM6
// OQ-004 resolution: 500ms debounce validated
import { EditorView, type ViewUpdate } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { debounce } from "../debounce";

/**
 * Creates a CM6 extension that auto-saves on document changes.
 * Uses a 500ms debounce per OQ-004 resolution.
 *
 * @param onSave - Callback receiving the full document text
 */
export function autosaveExtension(
  onSave: (content: string) => void | Promise<void>
): Extension {
  const debouncedSave = debounce((content: string) => {
    onSave(content);
  }, 500);

  return EditorView.updateListener.of((update: ViewUpdate) => {
    if (update.docChanged) {
      const content = update.state.doc.toString();
      debouncedSave(content);
    }
  });
}
