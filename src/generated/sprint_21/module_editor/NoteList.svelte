<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- Sprint 21 — NoteList: ノート一覧サイドバー -->
<script lang="ts">
  import { notesStore } from '$stores/notes';
  import type { NoteMetadata } from '$lib/types';

  export let onSelect: (note: NoteMetadata) => void;
  export let currentNoteId: string | null;

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<div class="note-list">
  {#each $notesStore as note (note.id)}
    <button
      class="note-item"
      class:active={note.id === currentNoteId}
      on:click={() => onSelect(note)}
    >
      {#if note.tags.length > 0}
        <div class="note-tags">
          {#each note.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
      <p class="note-preview">{note.preview}</p>
      <time class="note-date">{formatDate(note.created_at)}</time>
    </button>
  {:else}
    <p class="empty-message">ノートがありません</p>
  {/each}
</div>

<style>
  .note-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .note-item {
    width: 100%;
    text-align: left;
    padding: 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s;
  }

  .note-item:hover {
    background: var(--hover-bg, #edf2f7);
  }

  .note-item.active {
    background: var(--active-bg, #e2e8f0);
  }

  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
  }

  .tag {
    font-size: 11px;
    background: var(--tag-bg, #bee3f8);
    color: var(--tag-color, #2b6cb0);
    padding: 2px 6px;
    border-radius: 12px;
  }

  .note-preview {
    font-size: 12px;
    color: var(--text-primary, #2d3748);
    margin: 0 0 4px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-height: 1.4;
  }

  .note-date {
    font-size: 11px;
    color: var(--text-secondary, #718096);
  }

  .empty-message {
    text-align: center;
    color: var(--text-secondary, #718096);
    font-size: 13px;
    padding: 24px 16px;
  }
</style>
