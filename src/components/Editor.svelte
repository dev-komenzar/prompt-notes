<!-- Sprint 15 – CodeMirror 6 editor component with auto-save and frontmatter -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { EditorView } from "@codemirror/view";
  import { createEditor } from "../lib/editor/setup";
  import { readNote, createNote, saveNote } from "../lib/api";
  import {
    currentFilename,
    addToast,
    newNote as storeNewNote,
    goToGrid,
  } from "../lib/stores";
  import { generateNoteContent, extractBody } from "../lib/frontmatter";
  import CopyButton from "./CopyButton.svelte";

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;
  let filename: string | null = null;
  let saving = false;

  // Track the current filename from the store
  const unsubFilename = currentFilename.subscribe((f) => {
    filename = f;
  });

  async function handleSave(content: string) {
    if (!filename || saving) return;
    saving = true;
    try {
      await saveNote(filename, content);
    } catch (e) {
      addToast("error", `Save failed: ${e}`);
    } finally {
      saving = false;
    }
  }

  async function handleNewNote() {
    try {
      const content = generateNoteContent();
      const result = await createNote(content);
      currentFilename.set(result.filename);
      if (editorView) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: content,
          },
        });
        // Move cursor after frontmatter
        const pos = content.indexOf("\n---\n");
        if (pos >= 0) {
          const cursorPos = pos + 5;
          editorView.dispatch({
            selection: { anchor: cursorPos },
          });
        }
        editorView.focus();
      }
    } catch (e) {
      addToast("error", `Failed to create note: ${e}`);
    }
  }

  async function loadNote(fname: string) {
    try {
      const content = await readNote(fname);
      if (editorView) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: content,
          },
        });
        // Place cursor at end of document
        editorView.dispatch({
          selection: { anchor: content.length },
        });
        editorView.focus();
      }
    } catch (e) {
      addToast("error", `Failed to load note: ${e}`);
    }
  }

  function getEditorContent(): string {
    return editorView?.state.doc.toString() ?? "";
  }

  function getBodyContent(): string {
    return extractBody(getEditorContent());
  }

  onMount(async () => {
    editorView = createEditor({
      parent: editorContainer,
      onSave: handleSave,
      onNewNote: handleNewNote,
    });

    if (filename) {
      await loadNote(filename);
    } else {
      // Create a new note immediately
      await handleNewNote();
    }
  });

  onDestroy(() => {
    unsubFilename();
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }
  });
</script>

<div class="editor-wrapper">
  <div class="editor-header">
    <button class="back-btn" on:click={goToGrid} title="Back to Grid">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back
    </button>
    <span class="filename">{filename ?? "New Note"}</span>
    <div class="editor-actions">
      {#if saving}
        <span class="save-indicator">Saving...</span>
      {/if}
      <CopyButton getContent={getBodyContent} />
    </div>
  </div>
  <div class="editor-container" bind:this={editorContainer}></div>
</div>

<style>
  .editor-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .editor-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .back-btn:hover {
    background-color: var(--bg-surface);
    color: var(--text-primary);
  }

  .filename {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .editor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .save-indicator {
    font-size: 12px;
    color: var(--text-muted);
    font-style: italic;
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }

  .editor-container :global(.cm-scroller) {
    padding: 8px 16px;
  }
</style>
