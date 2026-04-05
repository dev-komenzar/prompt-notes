<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteEntry } from '../lib/types';
  import { formatCreatedAt } from '../lib/dateUtils';

  export let note: NoteEntry;

  const dispatch = createEventDispatcher<{
    'card-click': { filename: string };
  }>();

  function handleClick(): void {
    dispatch('card-click', { filename: note.filename });
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div
  class="note-card"
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
>
  <div class="card-body">
    <p class="card-preview">{note.body_preview}</p>
  </div>
  {#if note.tags.length > 0}
    <div class="card-tags">
      {#each note.tags as tag}
        <span class="tag-badge">{tag}</span>
      {/each}
    </div>
  {/if}
  <div class="card-footer">
    <time class="card-date">{formatCreatedAt(note.created_at)}</time>
  </div>
</div>

<style>
  .note-card {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    break-inside: avoid;
    margin-bottom: 12px;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .note-card:hover {
    border-color: var(--primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  .note-card:focus-visible {
    outline: 2px solid var(--primary, #3b82f6);
    outline-offset: 2px;
  }
  .card-body {
    margin-bottom: 8px;
  }
  .card-preview {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-color, #374151);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }
  .tag-badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    border-radius: 9999px;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-text, #1d4ed8);
  }
  .card-footer {
    border-top: 1px solid var(--border-color, #f3f4f6);
    padding-top: 6px;
  }
  .card-date {
    font-size: 11px;
    color: var(--text-secondary, #9ca3af);
  }
</style>
