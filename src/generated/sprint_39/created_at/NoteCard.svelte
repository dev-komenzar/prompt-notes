<script lang="ts">
  import { goto } from '$app/navigation';
  import TagBadge from '../task_39_2/TagBadge.svelte';
  import { formatCreatedAt } from './formatDate';
  import type { NoteMetadata } from '$lib/types/note';

  export let note: NoteMetadata;
  export let onDelete: (filename: string) => void = () => {};
  export let onTagClick: (tag: string) => void = () => {};

  function handleCardClick() {
    goto(`/edit/${encodeURIComponent(note.filename)}`);
  }

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    onDelete(note.filename);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="note-card" on:click={handleCardClick}>
  <div class="note-card__header">
    <span class="note-card__date">{formatCreatedAt(note.created_at)}</span>
    <button
      class="note-card__delete"
      on:click={handleDeleteClick}
      aria-label="削除"
    >✕</button>
  </div>

  {#if note.body_preview}
    <p class="note-card__preview">{note.body_preview}</p>
  {/if}

  {#if note.tags.length > 0}
    <div class="note-card__tags">
      {#each note.tags as tag (tag)}
        <TagBadge {tag} onClick={() => onTagClick(tag)} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .note-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    cursor: pointer;
    break-inside: avoid;
    transition: box-shadow 0.15s ease;
  }

  .note-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .note-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .note-card__date {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .note-card__delete {
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    font-size: 0.75rem;
    padding: 2px 4px;
    border-radius: 4px;
    line-height: 1;
  }

  .note-card__delete:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  .note-card__preview {
    font-size: 0.875rem;
    color: #334155;
    line-height: 1.5;
    margin: 0 0 8px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .note-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
</style>
