<script lang="ts">
  import { goto } from '$app/navigation';
  import TagBadge from '../../task_39_2/TagBadge.svelte';
  import { formatCreatedAt } from '../../created_at/formatDate';
  import type { NoteMetadata } from '$lib/types/note';

  export let note: NoteMetadata;
  export let onDelete: (filename: string) => void = () => {};
  export let onTagClick: (tag: string) => void = () => {};

  function handleCardClick() {
    goto(`/edit/${encodeURIComponent(note.filename)}`);
  }

  function handleDeleteClick(e: MouseEvent) {
    e.stopPropagation();
    onDelete(note.filename);
  }
</script>

<div class="note-card" role="button" tabindex="0" on:click={handleCardClick} on:keydown={(e) => e.key === 'Enter' && handleCardClick()}>
  <button class="delete-btn" aria-label="削除" on:click={handleDeleteClick}>✕</button>

  <p class="body-preview">{note.body_preview}</p>

  {#if note.tags.length > 0}
    <div class="tags">
      {#each note.tags as tag (tag)}
        <TagBadge {tag} onClick={() => onTagClick(tag)} />
      {/each}
    </div>
  {/if}

  <time class="created-at" datetime={note.created_at}>{formatCreatedAt(note.created_at)}</time>
</div>

<style>
  .note-card {
    position: relative;
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
    break-inside: avoid;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.15s ease;
    text-align: left;
    width: 100%;
    border: none;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .delete-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: #999;
    font-size: 14px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
    transition: background 0.1s, color 0.1s;
  }

  .delete-btn:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .body-preview {
    margin: 0 0 8px;
    font-size: 14px;
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

  .created-at {
    display: block;
    font-size: 11px;
    color: #9ca3af;
  }
</style>
