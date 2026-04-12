<script lang="ts">
  // @generated-from: docs/detailed_design/editor_clipboard_design.md §3.1
  // Past notes list displayed in the editor sidebar. Click to load for editing.

  import { createEventDispatcher } from 'svelte';
  import { notesStore } from './stores/notes';
  import type { NoteMetadata } from './types';

  export let selectedNoteId: string | null = null;

  const dispatch = createEventDispatcher<{
    select: NoteMetadata;
    delete: NoteMetadata;
  }>();

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<div class="note-list" role="list">
  {#if $notesStore.length === 0}
    <p class="empty">ノートがありません</p>
  {:else}
    {#each $notesStore as note (note.id)}
      <div
        class="note-item"
        class:selected={note.id === selectedNoteId}
        role="listitem button"
        tabindex="0"
        on:click={() => dispatch('select', note)}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && dispatch('select', note)}
      >
        {#if note.tags.length > 0}
          <div class="tags">
            {#each note.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <p class="preview">{note.preview}</p>
        <time class="date" datetime={note.created_at}>{formatDate(note.created_at)}</time>
      </div>
    {/each}
  {/if}
</div>

<style>
  .note-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
  }

  .empty {
    color: #a0aec0;
    font-size: 12px;
    text-align: center;
    padding: 20px 8px;
  }

  .note-item {
    padding: 10px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.1s;
  }

  .note-item:hover {
    background: #edf2f7;
  }

  .note-item.selected {
    background: #ebf8ff;
    border-color: #90cdf4;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
  }

  .tag {
    font-size: 10px;
    background: #e2e8f0;
    color: #4a5568;
    padding: 1px 6px;
    border-radius: 10px;
    white-space: nowrap;
  }

  .preview {
    font-size: 12px;
    color: #4a5568;
    margin: 0 0 4px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-all;
  }

  .date {
    font-size: 11px;
    color: #a0aec0;
    display: block;
  }
</style>
