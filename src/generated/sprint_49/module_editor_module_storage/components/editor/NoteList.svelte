<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notesStore, selectedNoteId } from '../../stores/notes';
  import type { NoteMetadata } from '../../lib/types';

  const dispatch = createEventDispatcher<{ select: string; delete: string }>();

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function handleSelect(id: string) {
    dispatch('select', id);
  }

  function handleDelete(e: MouseEvent, id: string) {
    e.stopPropagation();
    dispatch('delete', id);
  }
</script>

<style>
  .note-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    background: #f7fafc;
  }
  .note-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border-bottom: 1px solid #e2e8f0;
    cursor: pointer;
    transition: background 0.1s;
    position: relative;
  }
  .note-item:hover {
    background: #edf2f7;
  }
  .note-item.selected {
    background: #ebf8ff;
    border-left: 3px solid #3182ce;
  }
  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .tag {
    font-size: 11px;
    background: #e2e8f0;
    color: #4a5568;
    border-radius: 8px;
    padding: 1px 6px;
  }
  .note-preview {
    font-size: 12px;
    color: #4a5568;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .note-date {
    font-size: 11px;
    color: #a0aec0;
  }
  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: #a0aec0;
    font-size: 14px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .note-item:hover .delete-btn {
    opacity: 1;
  }
  .delete-btn:hover {
    background: #fed7d7;
    color: #c53030;
  }
  .empty {
    padding: 16px;
    font-size: 13px;
    color: #a0aec0;
    text-align: center;
  }
  .load-error {
    padding: 16px;
    font-size: 13px;
    color: #c53030;
    text-align: center;
  }
</style>

{#if $notesStore.length === 0}
  <div class="note-list">
    <p class="empty">ノートがありません</p>
  </div>
{:else}
  <div class="note-list" data-testid="note-list">
    {#each $notesStore as note (note.id)}
      <div
        class="note-item"
        class:selected={$selectedNoteId === note.id}
        on:click={() => handleSelect(note.id)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && handleSelect(note.id)}
        data-note-id={note.id}
      >
        {#if note.tags.length > 0}
          <div class="note-tags">
            {#each note.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <p class="note-preview">{note.preview || '(空のノート)'}</p>
        <time class="note-date">{formatDate(note.created_at)}</time>
        <button
          class="delete-btn"
          type="button"
          on:click={(e) => handleDelete(e, note.id)}
          aria-label="削除"
        >
          🗑
        </button>
      </div>
    {/each}
  </div>
{/if}
