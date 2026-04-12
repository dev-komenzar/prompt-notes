<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '../../types';

  export let notes: NoteMetadata[] = [];
  export let selectedId: string | null = null;

  const dispatch = createEventDispatcher<{ select: string }>();

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<aside class="note-list">
  {#if notes.length === 0}
    <div class="empty">ノートなし</div>
  {:else}
    {#each notes as note (note.id)}
      <div
        class="note-item"
        class:selected={note.id === selectedId}
        role="button"
        tabindex="0"
        on:click={() => dispatch('select', note.id)}
        on:keydown={(e) => e.key === 'Enter' && dispatch('select', note.id)}
      >
        <div class="note-preview">{note.preview || '（空のノート）'}</div>
        {#if note.tags.length > 0}
          <div class="note-tags">
            {#each note.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <div class="note-date">{formatDate(note.created_at)}</div>
      </div>
    {/each}
  {/if}
</aside>

<style>
  .note-list {
    width: 240px;
    min-width: 240px;
    height: 100%;
    overflow-y: auto;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-shrink: 0;
  }

  .empty {
    padding: 16px;
    color: #94a3b8;
    font-size: 13px;
    text-align: center;
  }

  .note-item {
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #e2e8f0;
    transition: background 0.1s ease;
    border-left: 3px solid transparent;
  }

  .note-item:hover {
    background: #f1f5f9;
  }

  .note-item.selected {
    background: #dbeafe;
    border-left-color: #3b82f6;
  }

  .note-preview {
    font-size: 13px;
    color: #374151;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-height: 1.4;
    word-break: break-word;
  }

  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }

  .tag {
    font-size: 10px;
    background: #dbeafe;
    color: #1e40af;
    padding: 1px 6px;
    border-radius: 8px;
  }

  .note-date {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 4px;
  }
</style>
