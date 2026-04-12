<script lang="ts">
  import { push } from 'svelte-spa-router';
  import type { NoteMetadata } from './types';

  export let note: NoteMetadata;

  function handleClick() {
    push(`/?note=${note.id}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
</script>

<div
  class="note-card"
  role="button"
  tabindex="0"
  aria-label={`ノートを開く: ${note.preview.slice(0, 30)}`}
  on:click={handleClick}
  on:keydown={handleKeydown}
>
  {#if note.preview}
    <p class="preview">{note.preview}</p>
  {:else}
    <p class="preview empty-preview">（本文なし）</p>
  {/if}

  {#if note.tags.length > 0}
    <div class="tags" aria-label="タグ">
      {#each note.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}

  <time class="created-at" datetime={note.created_at}>{formatDate(note.created_at)}</time>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    border-radius: 8px;
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.1s ease;
    display: block;
    text-align: left;
    width: 100%;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .note-card:focus-visible {
    outline: 2px solid var(--color-primary, #3b82f6);
    outline-offset: 2px;
  }

  .preview {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary, #111827);
    margin: 0 0 10px 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .empty-preview {
    color: var(--text-muted, #9ca3af);
    font-style: italic;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 9999px;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-color, #1d4ed8);
    border: 1px solid var(--tag-border, #bfdbfe);
    white-space: nowrap;
  }

  .created-at {
    font-size: 11px;
    color: var(--text-muted, #9ca3af);
    display: block;
  }
</style>
