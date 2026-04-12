<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { notesStore, selectedNoteId } from './stores/notes';
  import type { NoteMetadata } from './types';

  const dispatch = createEventDispatcher<{
    select: string;
    create: void;
  }>();

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function handleSelect(note: NoteMetadata) {
    dispatch('select', note.id);
  }

  function handleKeydown(e: KeyboardEvent, note: NoteMetadata) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dispatch('select', note.id);
    }
  }
</script>

<div class="note-list">
  <header class="note-list-header">
    <button class="new-note-btn" on:click={() => dispatch('create')}>
      ＋ 新規ノート
    </button>
  </header>

  {#if $notesStore.length === 0}
    <p class="empty-state">ノートがありません</p>
  {:else}
    <ul class="notes">
      {#each $notesStore as note (note.id)}
        <li
          class="note-item"
          class:selected={$selectedNoteId === note.id}
          on:click={() => handleSelect(note)}
          on:keydown={(e) => handleKeydown(e, note)}
          role="button"
          tabindex="0"
        >
          <div class="note-preview">{note.preview || '(空のノート)'}</div>
          <div class="note-meta">
            <time class="note-date">{formatDate(note.created_at)}</time>
            {#if note.tags.length > 0}
              <div class="note-tags">
                {#each note.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .note-list {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
  }

  .note-list-header {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
  }

  .new-note-btn {
    width: 100%;
    padding: 8px;
    background: #3182ce;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
  }

  .new-note-btn:hover {
    background: #2b6cb0;
  }

  .notes {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
  }

  .note-item {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    outline: none;
    border-left: 3px solid transparent;
  }

  .note-item:hover {
    background: #f7fafc;
  }

  .note-item:focus-visible {
    background: #ebf8ff;
  }

  .note-item.selected {
    background: #ebf8ff;
    border-left-color: #3182ce;
  }

  .note-preview {
    font-size: 12px;
    color: #2d3748;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .note-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .note-date {
    font-size: 11px;
    color: #a0aec0;
  }

  .note-tags {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 10px;
    background: #e2e8f0;
    color: #4a5568;
    padding: 1px 5px;
    border-radius: 10px;
  }

  .empty-state {
    padding: 24px 12px;
    font-size: 13px;
    color: #a0aec0;
    text-align: center;
  }
</style>
