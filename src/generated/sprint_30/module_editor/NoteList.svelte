<script lang="ts">
  // @sprint: 30
  // @task: 30-1
  // @module: editor
  // @implements: NoteList — ノート一覧サイドバー (AC-EDIT-02)
  import { onMount } from 'svelte';
  import { notesStore } from '$stores/notes';
  import { deleteNote, listNotes } from '$lib/ipc';
  import type { NoteMetadata } from '$lib/types';

  export let onSelect: (noteId: string) => void;

  let selectedId: string | null = null;
  let deleteError: string | null = null;

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function handleSelect(note: NoteMetadata) {
    selectedId = note.id;
    onSelect(note.id);
  }

  function handleKeydown(e: KeyboardEvent, note: NoteMetadata) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(note);
    }
  }

  async function handleDelete(e: MouseEvent, note: NoteMetadata) {
    e.stopPropagation();
    try {
      await deleteNote(note.id);
      const updated = await listNotes();
      notesStore.set(updated);
      if (selectedId === note.id) selectedId = null;
    } catch (err) {
      deleteError = 'ノートの削除に失敗しました';
      setTimeout(() => { deleteError = null; }, 3000);
      console.error('deleteNote failed:', err);
    }
  }
</script>

<div class="note-list">
  <div class="note-list-header">ノート一覧</div>

  {#if deleteError}
    <div class="list-error" role="alert">{deleteError}</div>
  {/if}

  {#if $notesStore.length === 0}
    <div class="empty-state">ノートがありません</div>
  {:else}
    {#each $notesStore as note (note.id)}
      <div
        class="note-item"
        class:selected={selectedId === note.id}
        role="button"
        tabindex="0"
        on:click={() => handleSelect(note)}
        on:keydown={(e) => handleKeydown(e, note)}
      >
        <div class="note-preview">{note.preview || '（空のノート）'}</div>
        {#if note.tags.length > 0}
          <div class="note-tags">
            {#each note.tags as tag}
              <span class="tag-chip">{tag}</span>
            {/each}
          </div>
        {/if}
        <div class="note-meta">
          <time class="note-date">{formatDate(note.created_at)}</time>
          <button
            class="delete-btn"
            title="削除"
            on:click={(e) => handleDelete(e, note)}
            aria-label="ノートを削除"
          >×</button>
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .note-list {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .note-list-header {
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0;
  }

  .list-error {
    padding: 8px 12px;
    background: #fed7d7;
    color: #c53030;
    font-size: 12px;
  }

  .empty-state {
    padding: 16px;
    color: #a0aec0;
    font-size: 13px;
    text-align: center;
  }

  .note-item {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background 0.1s ease;
    outline: none;
  }

  .note-item:hover {
    background: #edf2f7;
  }

  .note-item.selected {
    background: #ebf8ff;
    border-left: 3px solid #4299e1;
  }

  .note-item:focus-visible {
    box-shadow: inset 0 0 0 2px #4299e1;
  }

  .note-preview {
    font-size: 13px;
    color: #2d3748;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 6px;
  }

  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
  }

  .tag-chip {
    background: #bee3f8;
    color: #2b6cb0;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 10px;
  }

  .note-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .note-date {
    font-size: 11px;
    color: #a0aec0;
  }

  .delete-btn {
    background: none;
    border: none;
    color: #cbd5e0;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0 2px;
    opacity: 0;
    transition: opacity 0.15s, color 0.15s;
  }

  .note-item:hover .delete-btn,
  .note-item.selected .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: #e53e3e;
  }
</style>
