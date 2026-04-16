<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { readNote, saveNote } from "$lib/utils/tauri-commands";
  import type { NoteMetadata, SearchResultEntry } from "$lib/utils/tauri-commands";
  import { formatTimestamp } from "$lib/utils/timestamp";
  import NoteEditor from "./NoteEditor.svelte";
  import CopyButton from "./CopyButton.svelte";
  import DeleteButton from "./DeleteButton.svelte";

  export let metadata: NoteMetadata;
  export let editing = false;
  export let searchEntry: SearchResultEntry | null = null;
  export let registerEditor: (filename: string, getContent: () => string) => void;

  const dispatch = createEventDispatcher();
  let editor: NoteEditor | null = null;
  let initialContent = "";
  let loading = false;

  $: if (editing && !initialContent && !loading) {
    loadContent();
  }

  async function loadContent() {
    loading = true;
    try {
      const result = await readNote(metadata.filename);
      initialContent = result.content;
    } catch (e) {
      console.error("Failed to read note:", e);
    } finally {
      loading = false;
    }
  }

  export async function triggerSave() {
    let updated: NoteMetadata | null = null;
    if (editor) {
      const content = editor.getContent();
      if (content) {
        try {
          updated = await saveNote(metadata.filename, content);
        } catch (e) {
          console.error("Save failed:", e);
        }
      }
    }
    initialContent = "";
    dispatch("saved", updated);
  }

  function handleCardClick() {
    if (!editing) {
      dispatch("requestEdit");
    }
  }

  function handleEditorReady() {
    if (editor) {
      registerEditor(metadata.filename, () => editor?.getContent() ?? "");
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="note-card"
  class:editing
  data-filename={metadata.filename}
  on:click={handleCardClick}
  role="button"
  tabindex="0"
>
  {#if editing}
    {#if loading}
      <div class="loading">Loading...</div>
    {:else if initialContent}
      <NoteEditor
        bind:this={editor}
        content={initialContent}
        on:ready={handleEditorReady}
      />
    {/if}
  {:else}
    <div class="card-content">
      <div class="card-body">
        {#if searchEntry}
          {@html highlightSnippet(searchEntry.snippet, searchEntry.highlights)}
        {:else}
          {metadata.body_preview || "(empty)"}
        {/if}
      </div>
      <div class="card-footer">
        <div class="card-tags">
          {#each metadata.tags ?? [] as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
        <span class="card-time">{formatTimestamp(metadata.created_at)}</span>
        <div class="card-actions" on:click|stopPropagation>
          <CopyButton filename={metadata.filename} />
          <DeleteButton filename={metadata.filename} on:deleted />
        </div>
      </div>
    </div>
  {/if}
</div>

<script context="module" lang="ts">
  import type { HighlightRange } from "$lib/utils/tauri-commands";

  function highlightSnippet(snippet: string, highlights: HighlightRange[]): string {
    if (!highlights.length) return escapeHtml(snippet);
    let result = "";
    let lastEnd = 0;
    for (const hl of highlights) {
      result += escapeHtml(snippet.slice(lastEnd, hl.start));
      result += `<mark>${escapeHtml(snippet.slice(hl.start, hl.end))}</mark>`;
      lastEnd = hl.end;
    }
    result += escapeHtml(snippet.slice(lastEnd));
    return result;
  }

  function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
</script>

<style>
  .note-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.15s;
    flex-shrink: 0;
  }
  .note-card:not(.editing):hover {
    border-color: var(--accent);
    cursor: pointer;
  }
  .note-card.editing {
    border-color: var(--accent);
    min-height: 200px;
  }
  .card-content { padding: 12px 16px; }
  .card-body {
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 120px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .card-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .card-tags {
    display: flex;
    gap: 4px;
    flex: 1;
  }
  .tag {
    background: var(--tag-bg);
    color: var(--tag-text);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  .card-time {
    color: var(--text-muted);
    font-size: 12px;
  }
  .card-actions {
    display: flex;
    gap: 4px;
  }
  .loading {
    padding: 24px;
    text-align: center;
    color: var(--text-muted);
  }
  :global(mark) {
    background: rgba(250, 204, 21, 0.3);
    color: inherit;
  }
</style>
