<!--
  sprint:30 | module:editor | CoDD trace: detail:editor_clipboard, detail:component_architecture
  Main editor component for module:editor.
  - CodeMirror 6 with Markdown syntax highlight (no rendering / preview)
  - No title input field
  - Frontmatter background decoration
  - 1-click copy button (CopyButton.svelte)
  - Cmd+N / Ctrl+N new note creation
  - Auto-save with 500ms debounce via Tauri IPC
  All file operations route through api.ts → Tauri IPC → module:storage (Rust).
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    createEditorInstance,
    type EditorInstance,
  } from './editor-setup';
  import { readNote } from './api';
  import { extractBody } from './frontmatter';
  import CopyButton from './CopyButton.svelte';

  /** Filename of the note to load. Empty string triggers new note creation. */
  export let filename = '';

  /** Callback when the active filename changes (new note created / note switched). */
  export let onFilenameChange: ((f: string) => void) | undefined = undefined;

  let editorContainer: HTMLElement;
  let editor: EditorInstance | null = null;

  /**
   * Returns body text for the copy button (frontmatter excluded).
   * Acceptance criteria AC-ED-05: copy body only.
   */
  function getCopyText(): string {
    if (!editor) return '';
    return extractBody(editor.getDocumentText());
  }

  onMount(async () => {
    let initialContent = '';
    let initialFilename = filename;

    if (filename) {
      try {
        const response = await readNote(filename);
        initialContent = response.content;
      } catch (err) {
        console.error('[Editor] read_note failed:', filename, err);
      }
    }

    editor = createEditorInstance(editorContainer, {
      initialFilename,
      initialContent,
      onFilenameChange: (newFilename: string) => {
        filename = newFilename;
        onFilenameChange?.(newFilename);
      },
    });

    // If no filename was provided, auto-create a new note (Cmd+N equivalent)
    if (!filename) {
      await editor.handleCreateNote();
    }
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  });

  // React to external filename changes (e.g. navigating from grid)
  $: if (editor && filename && filename !== editor.getCurrentFilename()) {
    handleExternalNavigation(filename);
  }

  async function handleExternalNavigation(targetFilename: string): Promise<void> {
    if (!editor) return;
    try {
      const response = await readNote(targetFilename);
      editor.loadNote(targetFilename, response.content);
    } catch (err) {
      console.error('[Editor] read_note failed on nav:', targetFilename, err);
    }
  }
</script>

<div class="editor-screen">
  <div class="editor-toolbar">
    <CopyButton getTextFn={getCopyText} />
  </div>
  <div class="editor-content" bind:this={editorContainer}></div>
</div>

<style>
  .editor-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 6px 12px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--toolbar-bg, #fafafa);
    flex-shrink: 0;
  }

  .editor-content {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }

  /* CodeMirror root fills the container */
  .editor-content :global(.cm-editor) {
    height: 100%;
  }

  .editor-content :global(.cm-scroller) {
    overflow: auto;
  }

  /* Frontmatter background (also defined in baseTheme; global override for theming) */
  .editor-content :global(.cm-frontmatter-line) {
    background-color: var(--frontmatter-bg, rgba(59, 130, 246, 0.08));
  }
</style>
