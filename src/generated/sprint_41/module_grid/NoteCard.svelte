<!--
  sprint:41 task:41-1 module:grid
  NoteCard — individual Masonry card (CONV-GRID-1, CONV-GRID-3).
  Dispatches 'card-click' with { filename }.
  Variable height driven by body_preview length and tag count.
  Does NOT perform IPC calls.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteEntry } from './types';
  import { formatDisplayDate } from './date-utils';

  export let note: NoteEntry;

  const dispatch = createEventDispatcher<{
    'card-click': { filename: string };
  }>();

  function handleClick(): void {
    dispatch('card-click', { filename: note.filename });
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }
</script>

<article
  class="note-card"
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={handleKeydown}
  aria-label="ノート {note.filename} を開く"
>
  <div class="note-card__body">
    <p class="note-card__preview">{note.body_preview}</p>
  </div>

  {#if note.tags.length > 0}
    <div class="note-card__tags">
      {#each note.tags as tag (tag)}
        <span class="note-card__tag">{tag}</span>
      {/each}
    </div>
  {/if}

  <time class="note-card__date" datetime={note.created_at}>
    {formatDisplayDate(note.created_at)}
  </time>
</article>

<style>
  .note-card {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.5rem;
    padding: 0.875rem;
    cursor: pointer;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
    break-inside: avoid;
    margin-bottom: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .note-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-color: var(--border-hover-color, #d1d5db);
  }

  .note-card:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
  }

  .note-card__body {
    flex: 1;
  }

  .note-card__preview {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-primary, #374151);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .note-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .note-card__tag {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    font-size: 0.6875rem;
    line-height: 1.25;
    border-radius: 9999px;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-text, #1d4ed8);
    font-weight: 500;
  }

  .note-card__date {
    display: block;
    font-size: 0.75rem;
    color: var(--text-tertiary, #9ca3af);
  }
</style>
