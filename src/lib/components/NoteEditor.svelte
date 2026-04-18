<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorState } from "@codemirror/state";
  import { EditorView, keymap } from "@codemirror/view";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { markdown } from "@codemirror/lang-markdown";
  import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
  import { frontmatterHighlight } from "./frontmatter-decoration";
  import CopyButton from "./CopyButton.svelte";
  import DeleteButton from "./DeleteButton.svelte";
  import {
    createNote,
    readNote,
    saveNote as saveNoteCmd,
  } from "$lib/utils/tauri-commands";
  import { extractBody, generateNoteContent, parseNote } from "$lib/frontmatter";
  import { prependNote, updateNote, removeNote } from "$lib/stores/notes";
  import { handleCommandError } from "$lib/utils/error-handler";
  import { registerPendingSave, clearPendingSave } from "$lib/utils/window-close";
  import { debounce } from "$lib/utils/debounce";

  interface Props {
    filename: string | null;
    onBack: () => void;
  }

  let { filename, onBack }: Props = $props();

  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;
  let currentFilename: string | null = $state(filename);
  let isDirty = $state(false);
  let currentTags: string[] = $state([]);
  let lastSavedContent = "";
  let createDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const AUTO_SAVE_MS = 2000;

  const debouncedAutoSave = debounce(async () => {
    if (isDirty && currentFilename && view) {
      await doSave();
    }
  }, AUTO_SAVE_MS);

  async function doSave(): Promise<void> {
    if (!view || !currentFilename) return;
    const content = view.state.doc.toString();
    if (content === lastSavedContent) {
      isDirty = false;
      return;
    }
    try {
      const updated = await saveNoteCmd(currentFilename, content);
      updateNote(updated);
      lastSavedContent = content;
      isDirty = false;
    } catch (error) {
      handleCommandError(error);
    }
  }

  async function initEditor(content: string): Promise<void> {
    const state = EditorState.create({
      doc: content,
      extensions: [
        keymap.of([...defaultKeymap, ...historyKeymap]),
        history(),
        markdown(),
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

    view = new EditorView({
      state,
      parent: editorContainer,
    });

    lastSavedContent = content;
  }

  onMount(async () => {
    registerPendingSave(doSave);

    try {
      if (filename) {
        // Existing note
        currentFilename = filename;
        const raw = await readNote(filename);
        const parsed = parseNote(raw);
        currentTags = parsed.tags;
        await initEditor(raw);
      } else {
        // New note — debounce creation
        if (createDebounceTimer) clearTimeout(createDebounceTimer);
        createDebounceTimer = setTimeout(async () => {
          try {
            const meta = await createNote([]);
            currentFilename = meta.filename;
            currentTags = meta.tags;
            prependNote(meta);
            const raw = await readNote(meta.filename);
            await initEditor(raw);
          } catch (error) {
            handleCommandError(error);
          }
        }, 500);
      }
    } catch (error) {
      handleCommandError(error);
    }
  });

  onDestroy(() => {
    if (createDebounceTimer) clearTimeout(createDebounceTimer);
    clearPendingSave();
    if (isDirty && currentFilename && view) {
      // Fire-and-forget save on destroy
      const content = view.state.doc.toString();
      if (content !== lastSavedContent && currentFilename) {
        saveNoteCmd(currentFilename, content).catch(() => {});
      }
    }
    view?.destroy();
    view = null;
  });

  function getBodyText(): string {
    if (!view) return "";
    return extractBody(view.state.doc.toString());
  }

  async function handleDelete(): Promise<void> {
    if (currentFilename) {
      removeNote(currentFilename);
    }
    onBack();
  }
</script>

<div class="editor-wrapper">
  <div class="editor-toolbar">
    <div class="editor-tags">
      {#each currentTags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
    <div class="editor-actions">
      {#if isDirty}
        <span class="save-indicator">Unsaved</span>
      {/if}
      <CopyButton getContent={getBodyText} />
      {#if currentFilename}
        <DeleteButton filename={currentFilename} onDeleted={handleDelete} />
      {/if}
    </div>
  </div>
  <div class="editor-container" bind:this={editorContainer}></div>
</div>

<style>
  .editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
  }
  .editor-tags {
    display: flex;
    gap: 4px;
  }
  .tag {
    background: var(--tag-bg);
    color: var(--tag-text);
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .editor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .save-indicator {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-style: italic;
  }
  .editor-container {
    flex: 1;
    overflow: auto;
  }
  .editor-container :global(.cm-editor) {
    height: 100%;
    font-family: var(--font-mono);
    font-size: 0.95rem;
  }
  .editor-container :global(.cm-scroller) {
    padding: 16px;
  }
  .editor-container :global(.cm-focused) {
    outline: none;
  }
</style>
