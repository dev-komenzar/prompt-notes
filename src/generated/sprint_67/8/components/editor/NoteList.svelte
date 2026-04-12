<!-- @traceability: detail:editor_clipboard §3.1, design:system-design §2.6.6 -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '../../lib/types';

  export let notes: NoteMetadata[] = [];
  export let selectedId: string | null = null;

  const dispatch = createEventDispatcher<{
    select: string;
    delete: string;
  }>();

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
</script>

<aside class="note-list">
  {#each notes as note (note.id)}
    <div
      class="note-item"
      class:selected={note.id === selectedId}
      role="button"
      tabindex="0"
      on:click={() => dispatch('select', note.id)}
      on:keydown={(e) => e.key === 'Enter' && dispatch('select', note.id)}
    >
      {#if note.tags.length > 0}
        <div class="tags">
          {#each note.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
      <p class="preview">{note.preview || '（空のノート）'}</p>
      <time class="date">{formatDate(note.created_at)}</time>
      <button
        class="delete-btn"
        on:click|stopPropagation={() => dispatch('delete', note.id)}
        aria-label="ノートを削除"
        title="削除"
      >
        🗑
      </button>
    </div>
  {/each}
  {#if notes.length === 0}
    <p class="empty">ノートがありません</p>
  {/if}
</aside>

<style>
  .note-list {
    width: 240px;
    min-width: 240px;
    height: 100%;
    overflow-y: auto;
    border-right: 1px solid var(--border, #e2e8f0);
    background: var(--sidebar-bg, #f8fafc);
  }
  .note-item {
    position: relative;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border, #e2e8f0);
    cursor: pointer;
    transition: background 0.1s;
  }
  .note-item:hover {
    background: var(--hover-bg, #f1f5f9);
  }
  .note-item.selected {
    background: var(--selected-bg, #e0e7ff);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
  }
  .tag {
    font-size: 10px;
    background: var(--tag-bg, #dbeafe);
    color: var(--tag-color, #1d4ed8);
    border-radius: 3px;
    padding: 1px 5px;
  }
  .preview {
    font-size: 12px;
    color: var(--text-secondary, #475569);
    margin: 0 0 4px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .date {
    font-size: 10px;
    color: var(--text-muted, #94a3b8);
  }
  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0;
    font-size: 14px;
    padding: 2px;
  }
  .note-item:hover .delete-btn {
    opacity: 0.6;
  }
  .delete-btn:hover {
    opacity: 1 !important;
  }
  .empty {
    padding: 16px;
    font-size: 13px;
    color: var(--text-muted, #94a3b8);
    text-align: center;
  }
</style>
