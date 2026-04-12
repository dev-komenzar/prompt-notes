<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @sprint: 22 — 自動保存パイプライン実装 -->
<script lang="ts">
  import { notesStore } from '$stores/notes';
  import type { NoteMetadata } from '$lib/types';

  export let onSelect: (note: NoteMetadata) => void;

  let selectedId: string | null = null;

  function handleClick(note: NoteMetadata) {
    selectedId = note.id;
    onSelect(note);
  }

  function handleKeydown(e: KeyboardEvent, note: NoteMetadata) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(note);
    }
  }

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<div class="note-list">
  {#if $notesStore.length === 0}
    <p class="empty-state">ノートがありません</p>
  {:else}
    {#each $notesStore as note (note.id)}
      <div
        class="note-item"
        class:selected={selectedId === note.id}
        role="button"
        tabindex="0"
        on:click={() => handleClick(note)}
        on:keydown={(e) => handleKeydown(e, note)}
      >
        {#if note.tags.length > 0}
          <div class="note-tags">
            {#each note.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <p class="note-preview">{note.preview || '（本文なし）'}</p>
        <time class="note-date">{formatDate(note.created_at)}</time>
      </div>
    {/each}
  {/if}
</div>

<style>
  .note-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .empty-state {
    color: #a0aec0;
    font-size: 13px;
    text-align: center;
    padding: 24px 8px;
  }

  .note-item {
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.1s ease, border-color 0.1s ease;
  }

  .note-item:hover {
    background: #edf2f7;
  }

  .note-item.selected {
    background: #ebf8ff;
    border-color: #90cdf4;
  }

  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
  }

  .tag {
    font-size: 11px;
    background: #e2e8f0;
    color: #4a5568;
    padding: 1px 6px;
    border-radius: 10px;
  }

  .note-preview {
    font-size: 12px;
    color: #2d3748;
    margin: 0 0 4px;
    line-height: 1.4;
    /* Clamp to 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .note-date {
    font-size: 11px;
    color: #a0aec0;
  }
</style>
