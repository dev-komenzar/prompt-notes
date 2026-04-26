<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, keymap } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { markdown } from "@codemirror/lang-markdown";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { frontmatterHighlight } from "../editor/frontmatter-decoration";
  import { readNote, saveNote } from "../shell/tauri-commands";
  import { updateNote } from "./notes";
  import { handleCommandError } from "../shell/error-handler";
  import { debounce } from "../shell/debounce";

  interface Props {
    filename: string;
    onSave: () => void;
  }

  let { filename, onSave }: Props = $props();

  let editorContainer: HTMLElement;
  let view: EditorView | null = null;

  const autoSave = debounce(async (content: string) => {
    try {
      const updated = await saveNote(filename, content);
      updateNote(updated);
    } catch (err) {
      handleCommandError(err);
    }
  }, 500);

  onMount(async () => {
    try {
      const content = await readNote(filename);

      const state = EditorState.create({
        doc: content,
        extensions: [
          keymap.of([...defaultKeymap, ...historyKeymap]),
          history(),
          markdown(),
          frontmatterHighlight(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              autoSave(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            "&": {
              fontSize: "14px",
              fontFamily: "var(--font-mono)",
            },
            ".cm-content": {
              minHeight: "100px",
            },
          }),
          keymap.of([
            {
              key: "Escape",
              run: () => {
                onSave();
                return true;
              },
            },
          ]),
        ],
      });

      view = new EditorView({
        state,
        parent: editorContainer,
      });

      view.focus();
    } catch (err) {
      handleCommandError(err);
    }
  });

  onDestroy(() => {
    view?.destroy();
  });
</script>

<div
  class="note-editor"
  data-testid="note-editor"
  bind:this={editorContainer}
></div>

<style>
  .note-editor {
    min-height: 120px;
    padding: 4px;
  }

  .note-editor :global(.cm-editor) {
    outline: none;
    border: none;
  }

  .note-editor :global(.cm-focused) {
    outline: none;
  }
</style>
