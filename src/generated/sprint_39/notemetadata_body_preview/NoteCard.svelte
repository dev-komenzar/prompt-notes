<script lang="ts">
  import { goto } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';

  export let note: {
    filename: string;
    tags: string[];
    body_preview: string;
    created_at: string;
  };

  const dispatch = createEventDispatcher<{ delete: { filename: string } }>();

  function formatCreatedAt(createdAt: string): string {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return createdAt;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleCardClick() {
    goto(`/edit/${encodeURIComponent(note.filename)}`);
  }

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    dispatch('delete', { filename: note.filename });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="note-card" on:click={handleCardClick}>
  <button
    class="delete-button"
    aria-label="削除"
    on:click={handleDeleteClick}
  >
    ✕
  </button>

  {#if note.body_preview}
    <p class="body-preview">{note.body_preview}</p>
  {/if}

  {#if note.tags.length > 0}
    <div class="tags">
      {#each note.tags as tag}
        <span class="tag-badge">{tag}</span>
      {/each}
    </div>
  {/if}

  <time class="created-at" datetime={note.created_at}>
    {formatCreatedAt(note.created_at)}
  </time>
</div>

<style>
  .note-card {
    position: relative;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    break-inside: avoid;
    margin-bottom: 16px;
    transition: box-shadow 0.15s ease;
  }

  .note-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .delete-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
    transition: background-color 0.1s ease, color 0.1s ease;
  }

  .delete-button:hover {
    background-color: #fee2e2;
    color: #dc2626;
  }

  .body-preview {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
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

  .tag-badge {
    display: inline-block;
    background-color: #eff6ff;
    color: #1d4ed8;
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
</style>
