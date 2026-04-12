<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '../../lib/types';

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
    <p class="empty">ノートがありません</p>
  {:else}
    {#each notes as note (note.id)}
      <div
        class="note-item"
        class:selected={note.id === selectedId}
        on:click={() => dispatch('select', note.id)}
        on:keydown={(e) => e.key === 'Enter' && dispatch('select', note.id)}
        role="button"
        tabindex="0"
      >
        {#if note.tags.length > 0}
          <div class="note-tags">
            {#each note.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
        <p class="preview">{note.preview || '(空のノート)'}</p>
        <time class="date">{formatDate(note.created_at)}</time>
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
    border-right: 1px solid var(--border-color, #e2e8f0);
    background: var(--sidebar-bg, #f8fafc);
    flex-shrink: 0;
  }

  .empty {
    padding: 16px;
    color: var(--muted-color, #94a3b8);
    font-size: 13px;
    text-align: center;
    margin-top: 32px;
  }

  .note-item {
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    transition: background 0.1s;
  }

  .note-item:hover {
    background: var(--item-hover-bg, #f1f5f9);
  }

  .note-item.selected {
    background: var(--item-selected-bg, #eff6ff);
    border-left: 3px solid var(--accent-color, #3b82f6);
    padding-left: 13px;
  }

  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-bottom: 5px;
  }

  .tag {
    font-size: 10px;
    padding: 1px 5px;
    background: var(--tag-bg, #dbeafe);
    color: var(--tag-color, #1e40af);
    border-radius: 8px;
  }

  .preview {
    font-size: 12px;
    color: var(--text-color, #334155);
    margin: 0 0 4px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
    word-break: break-word;
  }

  .date {
    font-size: 11px;
    color: var(--muted-color, #94a3b8);
  }
</style>
