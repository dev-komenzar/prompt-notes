<script lang="ts">
  import { goto } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';
  import TagBadge from './TagBadge.svelte';

  export let note: {
    filename: string;
    tags: string[];
    body_preview: string;
    created_at: string;
  };

  export let onTagClick: ((tag: string) => void) | undefined = undefined;

  const dispatch = createEventDispatcher<{ delete: { filename: string } }>();

  function formatCreatedAt(created_at: string): string {
    try {
      const d = new Date(created_at);
      if (isNaN(d.getTime())) return created_at;
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return created_at;
    }
  }

  function handleCardClick() {
    goto(`/edit/${encodeURIComponent(note.filename)}`);
  }

  function handleDeleteClick(e: MouseEvent) {
    e.stopPropagation();
    dispatch('delete', { filename: note.filename });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<article
  class="note-card"
  role="button"
  tabindex="0"
  on:click={handleCardClick}
  on:keydown={handleKeyDown}
  aria-label="ノートを開く: {note.filename}"
>
  {#if note.body_preview}
    <p class="body-preview">{note.body_preview}</p>
  {/if}

  {#if note.tags.length > 0}
    <div class="tags" on:click|stopPropagation>
      {#each note.tags as tag (tag)}
        <TagBadge {tag} onClick={onTagClick} />
      {/each}
    </div>
  {/if}

  <div class="card-footer">
    <time class="created-at" datetime={note.created_at}>
      {formatCreatedAt(note.created_at)}
    </time>
    <button
      class="delete-btn"
      aria-label="削除: {note.filename}"
      on:click={handleDeleteClick}
    >
      ×
    </button>
  </div>
</article>

<style>
  .note-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    break-inside: avoid;
    margin-bottom: 16px;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  .note-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
  }

  .note-card:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .body-preview {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }

  .created-at {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .delete-btn {
    background: none;
    border: none;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 1rem;
    color: #9ca3af;
    cursor: pointer;
    line-height: 1;
    transition: background-color 0.1s ease, color 0.1s ease;
  }

  .delete-btn:hover {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
</style>
