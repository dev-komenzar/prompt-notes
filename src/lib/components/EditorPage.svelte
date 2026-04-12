<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { createEditor } from '$lib/editor/create-editor';
  import { createNote, readNote, saveNote } from '$lib/api';
  import { extractBody, parseFrontmatterTags, generateFrontmatter } from '$lib/frontmatter';
  import { copyNoteBody } from '$lib/clipboard';
  import { addToast, newNote } from '$lib/stores';
  import type { EditorView } from '@codemirror/view';

  let { filename }: { filename: string | null } = $props();

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;
  let overrideFilename = $state<string | null>(null);
  let currentFilename = $derived(overrideFilename ?? filename);
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let copyStatus = $state<'idle' | 'copied'>('idle');

  async function handleSave(content: string) {
    if (!currentFilename) {
      const tags = parseFrontmatterTags(content);
      const body = extractBody(content);
      try {
        saveStatus = 'saving';
        const result = await createNote(body, tags);
        overrideFilename = result.filename;
        history.replaceState(null, '', `/edit/${encodeURIComponent(currentFilename)}`);
        saveStatus = 'saved';
      } catch (err) {
        saveStatus = 'error';
        addToast('error', `保存に失敗しました: ${err}`);
      }
    } else {
      const tags = parseFrontmatterTags(content);
      const body = extractBody(content);
      try {
        saveStatus = 'saving';
        await saveNote(currentFilename, body, tags);
        saveStatus = 'saved';
      } catch (err) {
        saveStatus = 'error';
        addToast('error', `保存に失敗しました: ${err}`);
      }
    }
  }

  function handleNewNote(): boolean {
    newNote();
    goto('/new');
    return true;
  }

  async function handleCopy() {
    if (!editorView) return;
    const content = editorView.state.doc.toString();
    const ok = await copyNoteBody(content);
    if (ok) {
      copyStatus = 'copied';
      setTimeout(() => { copyStatus = 'idle'; }, 1500);
    } else {
      addToast('error', 'コピーに失敗しました');
    }
  }

  onMount(async () => {
    let initialContent = generateFrontmatter() + "\n";

    if (currentFilename) {
      try {
        const note = await readNote(currentFilename);
        initialContent = note.raw;
      } catch (err) {
        addToast('error', `ノートの読み込みに失敗しました: ${err}`);
      }
    }

    editorView = createEditor({
      parent: editorContainer,
      content: initialContent,
      onSave: handleSave,
      onNewNote: handleNewNote,
    });
  });

  onDestroy(() => {
    editorView?.destroy();
  });
</script>

<div class="editor-page">
  <div class="editor-toolbar">
    <button class="back-btn" onclick={() => goto('/')}>← Grid</button>
    <div class="toolbar-right">
      <span class="save-indicator" class:saving={saveStatus === 'saving'} class:saved={saveStatus === 'saved'} class:error={saveStatus === 'error'}>
        {#if saveStatus === 'saving'}Saving...{:else if saveStatus === 'saved'}Saved{:else if saveStatus === 'error'}Error{:else}&nbsp;{/if}
      </span>
      <button class="copy-btn" onclick={handleCopy} title="Copy body to clipboard">
        {#if copyStatus === 'copied'}Copied!{:else}Copy{/if}
      </button>
    </div>
  </div>
  <div class="editor-container" bind:this={editorContainer}></div>
</div>

<style>
  .editor-page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-btn {
    padding: 4px 10px;
    font-size: 13px;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    transition: color 0.15s;
  }

  .back-btn:hover {
    color: var(--color-text);
  }

  .save-indicator {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .save-indicator.saving {
    color: var(--color-warning);
  }

  .save-indicator.saved {
    color: var(--color-success);
  }

  .save-indicator.error {
    color: var(--color-danger);
  }

  .copy-btn {
    padding: 4px 12px;
    font-size: 13px;
    background-color: var(--color-bg-secondary);
    color: var(--color-text);
    border-radius: var(--radius-sm);
    transition: background-color 0.15s;
  }

  .copy-btn:hover {
    background-color: var(--color-border);
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }
</style>
