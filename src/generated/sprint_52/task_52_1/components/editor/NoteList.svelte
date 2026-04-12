<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { notesStore } from '../../stores/notes';
  import { listNotes } from '../../lib/ipc';
  import type { NoteMetadata } from '../../lib/types';

  export let selectedId: string | null = null;

  const dispatch = createEventDispatcher<{
    select: string;
    delete: string;
  }>();

  let loadError = false;

  onMount(async () => {
    await refresh();
  });

  export async function refresh() {
    try {
      loadError = false;
      const notes = await listNotes();
      notesStore.set(notes);
    } catch {
      loadError = true;
    }
  }

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function handleSelect(note: NoteMetadata) {
    dispatch('select', note.id);
  }

  function handleDelete(e: MouseEvent, noteId: string) {
    e.stopPropagation();
    dispatch('delete', noteId);
  }
</script>

<div class="note-list">
  {#if loadError}
    <p class="error-text">読み込み失敗</p>
  {:else if $notesStore.length === 0}
    <p class="empty-text">ノートがありません</p>
  {:else}
    {#each $notesStore as note (note.id)}
      <div
        class="note-item"
        class:active={note.id === selectedId}
        role="button"
        tabindex="0"
        on:click={() => handleSelect(note)}
        on:keydown={(e) => e.key === 'Enter' && handleSelect(note)}
      >
        <div class="note-meta">
          {#if note.tags.length > 0}
            <div class="note-tags">
              {#each note.tags as tag}
                <span class="tag">{tag}</span>
              {/each}
            </div>
          {/if}
          <time class="note-date">{formatDate(note.created_at)}</time>
        </div>
        <p class="note-preview">{note.preview || '（空のノート）'}</p>
        <button
          class="delete-btn"
          on:click={(e) => handleDelete(e, note.id)}
          aria-label="削除"
          title="削除"
        >
          🗑
        </button>
      </div>
    {/each}
  {/if}
</div>

<style>
  .note-list {
    width: 240px;
    flex-shrink: 0;
    height: 100%;
    overflow-y: auto;
    border-right: 1px solid var(--border-color, #e2e8f0);
    background: var(--sidebar-bg, #f7fafc);
  }

  .note-item {
    position: relative;
    padding: 12px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .note-item:hover {
    background: var(--hover-bg, #edf2f7);
  }

  .note-item.active {
    background: var(--active-bg, #ebf8ff);
    border-left: 3px solid var(--accent, #4299e1);
  }

  .note-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .note-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 10px;
    padding: 1px 6px;
    background: var(--tag-bg, #bee3f8);
    color: var(--tag-color, #2b6cb0);
    border-radius: 8px;
  }

  .note-date {
    font-size: 10px;
    color: var(--muted, #718096);
    flex-shrink: 0;
  }

  .note-preview {
    font-size: 12px;
    color: var(--text, #4a5568);
    margin: 0;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    padding-right: 24px;
  }

  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.15s ease;
    padding: 2px;
  }

  .note-item:hover .delete-btn {
    opacity: 0.6;
  }

  .delete-btn:hover {
    opacity: 1 !important;
  }

  .error-text,
  .empty-text {
    font-size: 12px;
    color: var(--muted, #718096);
    text-align: center;
    padding: 24px 12px;
  }

  .error-text {
    color: #e53e3e;
  }
</style>
