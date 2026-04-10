<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '@/generated/sprint_38/2_600px_900px/MasonryGrid.svelte';

  export let notes: NoteMetadata[] = [];

  const dispatch = createEventDispatcher<{
    cardClick: { filename: string };
    cardDelete: { filename: string };
  }>();

  function handleCardClick(filename: string) {
    dispatch('cardClick', { filename });
  }

  function handleCardDelete(event: MouseEvent, filename: string) {
    event.stopPropagation();
    dispatch('cardDelete', { filename });
  }

  function formatDate(createdAt: string): string {
    return createdAt.replace('T', ' ').slice(0, 16);
  }
</script>

<div class="masonry-grid">
  {#each notes as note (note.filename)}
    <div
      class="note-card"
      role="button"
      tabindex="0"
      on:click={() => handleCardClick(note.filename)}
      on:keydown={(e) => e.key === 'Enter' && handleCardClick(note.filename)}
    >
      <button
        class="delete-btn"
        aria-label="ノートを削除"
        on:click={(e) => handleCardDelete(e, note.filename)}
      >✕</button>
      <p class="body-preview">{note.body_preview}</p>
      {#if note.tags.length > 0}
        <div class="tags">
          {#each note.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
      <time class="date">{formatDate(note.created_at)}</time>
    </div>
  {/each}
</div>

{#if notes.length === 0}
  <p class="empty-message">この期間のノートはありません。日付フィルタを変更してください。</p>
{/if}

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

  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    line-height: 1;
  }

  .delete-btn:hover {
    background: #fee2e2;
    color: #ef4444;
  }

  .body-preview {
    margin: 0 0 8px;
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
    padding: 2px 6px;
    border-radius: 9999px;
    border: 1px solid #bfdbfe;
  }

  .date {
    display: block;
    font-size: 11px;
    color: #9ca3af;
  }

  .empty-message {
    text-align: center;
    color: #6b7280;
    padding: 48px 16px;
    font-size: 14px;
  }
</style>
