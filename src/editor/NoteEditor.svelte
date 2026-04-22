<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorState } from "@codemirror/state";
  import { EditorView, keymap } from "@codemirror/view";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
  import { languages } from "@codemirror/language-data";
  import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
  import { frontmatterHighlight } from "./frontmatter-decoration";
  import {
    readNote,
    saveNote as saveNoteCmd,
  } from "$lib/shell/tauri-commands";
  import { updateNote } from "$lib/feed/notes";
  import { handleCommandError } from "$lib/shell/error-handler";
  import { registerPendingSave, clearPendingSave } from "$lib/shell/window-close";
  import { debounce } from "$lib/shell/debounce";

  interface EditorApi {
    getRawContent(): string;
  }

  interface Props {
    filename: string;
    api?: EditorApi | null;
    onExit?: () => void;
  }

  let { filename, api = $bindable(), onExit }: Props = $props();

  let editorContainer: HTMLDivElement | undefined;
  let view: EditorView | null = null;
  let isDirty = false;
  let lastSavedContent = "";

  const AUTO_SAVE_MS = 2000;

  const debouncedAutoSave = debounce(async () => {
    if (isDirty && view) {
      await doSave();
    }
  }, AUTO_SAVE_MS);

  async function doSave(): Promise<void> {
    if (!view) return;
    const content = view.state.doc.toString();
    if (content === lastSavedContent) {
      isDirty = false;
      return;
    }
    try {
      const updated = await saveNoteCmd(filename, content);
      updateNote(updated);
      lastSavedContent = content;
      isDirty = false;
    } catch (error) {
      handleCommandError(error);
    }
  }

  function setupEditor(content: string): void {
    const state = EditorState.create({
      doc: content,
      selection: { anchor: content.length },
      extensions: [
        keymap.of([
          {
            key: "Escape",
            run: () => {
              void doSave();
              onExit?.();
              return true;
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        history(),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        frontmatterHighlight(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            isDirty = true;
            debouncedAutoSave();
          }
        }),
      ],
    });

    view = new EditorView({ state, parent: editorContainer as HTMLDivElement });
    lastSavedContent = content;
    view.focus();
  }

  onMount(async () => {
    registerPendingSave(doSave);
    api = {
      getRawContent: () => view?.state.doc.toString() ?? "",
    };
    try {
      const raw = await readNote(filename);
      setupEditor(raw);
    } catch (error) {
      handleCommandError(error);
    }
  });

  onDestroy(() => {
    clearPendingSave();
    if (isDirty && view) {
      const content = view.state.doc.toString();
      if (content !== lastSavedContent) {
        saveNoteCmd(filename, content)
          .then(updateNote)
          .catch(() => {});
      }
    }
    view?.destroy();
    view = null;
    api = null;
  });
</script>

<div class="note-editor">
  <div class="editor-container" bind:this={editorContainer}></div>
</div>

<style>
  .note-editor {
    width: 100%;
  }
  .editor-container {
    width: 100%;
  }
  .note-editor :global(.cm-editor) {
    border-radius: var(--radius);
    background: var(--surface);
    font-family: var(--font-mono);
    font-size: 0.95rem;
  }
  .note-editor :global(.cm-scroller) {
    padding: 8px;
  }
  .note-editor :global(.cm-focused) {
    outline: none;
  }
</style>
