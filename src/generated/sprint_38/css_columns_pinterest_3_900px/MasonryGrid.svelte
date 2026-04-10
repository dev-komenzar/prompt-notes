<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '$lib/types/note';

  export let notes: NoteMetadata[] = [];

  const dispatch = createEventDispatcher<{
    cardClick: { filename: string };
    delete: { filename: string };
  }>();

  function handleCardClick(filename: string) {
    dispatch('cardClick', { filename });
  }

  function handleDelete(event: MouseEvent, filename: string) {
    event.stopPropagation();
    dispatch('delete', { filename });
  }

  function formatDate(createdAt: string): string {
    return createdAt.replace('T', ' ').slice(0, 16);
  }
</script>

<div class="masonry-grid" role="list">
  {#each notes as note (note.filename)}
    <div
      class="note-card"
      role="listitem"
      tabindex="0"
      on:click={() => handleCardClick(note.filename)}
      on:keydown={(e) => e.key === 'Enter' && handleCardClick(note.filename)}
    >
      <button
        class="delete-btn"
        aria-label="ノートを削除"
        on:click={(e) => handleDelete(e, note.filename)}
      >
        ✕
      </button>

      {#if note.body_preview}
        <p class="body-preview">{note.body_preview}</p>
      {/if}

      {#if note.tags.length > 0}
        <div class="tags">
          {#each note.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}

      <time class="created-at" datetime={note.created_at}>
        {formatDate(note.created_at)}
      </time>
    </div>
  {/each}

  {#if notes.length === 0}
    <p class="empty-message">この期間のノートはありません。日付フィルタを変更してください。</p>
  {/if}
</div>

<style>
  .masonry-grid {
    columns: 3;
    column-gap: 16px;
    padding: 16px;
  }

  @media (max-width: 900px) {
    .masonry-grid {
      columns: 2;
    }
  }

  @media (max-width: 600px) {
    .masonry-grid {
      columns: 1;
    }
  }

  .note-card {
    break-inside: avoid;
    display: block;
    position: relative;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: box-shadow 0.15s ease;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .note-card:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
  }

  .delete-btn:hover {
    background: #fee2e2;
    color: #ef4444;
  }

  .body-preview {
    margin: 0 0 8px 0;
    font-size: 14px;
    line-height: 1.5;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-word;
    padding-right: 20px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tag {
    background: #eff6ff;
    color: #3b82f6;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid #bfdbfe;
  }

  .created-at {
    display: block;
    font-size: 11px;
    color: #9ca3af;
  }

  .empty-message {
    column-span: all;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    padding: 32px 16px;
  }
</style>
