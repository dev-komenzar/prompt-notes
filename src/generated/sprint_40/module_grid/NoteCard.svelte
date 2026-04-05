<!-- CoDD Traceability: sprint:40 task:40-1 module:grid detail:grid_search CONV-GRID-1 CONV-GRID-3 -->
<!-- Individual card component for Pinterest-style masonry grid. Card height varies with body_preview length. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteEntry } from './types';
  import { formatDisplayDate } from './date_utils';

  export let entry: NoteEntry;

  const dispatch = createEventDispatcher<{
    'card-click': { filename: string };
  }>();

  function handleClick(): void {
    dispatch('card-click', { filename: entry.filename });
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<article
  class="note-card"
  role="button"
  tabindex="0"
  aria-label="ノート {entry.filename} を開く"
  on:click={handleClick}
  on:keydown={handleKeyDown}
>
  {#if entry.tags.length > 0}
    <div class="note-card__tags">
      {#each entry.tags as tag (tag)}
        <span class="note-card__tag">{tag}</span>
      {/each}
    </div>
  {/if}

  <div class="note-card__preview">
    {entry.body_preview}
  </div>

  <div class="note-card__meta">
    <time class="note-card__date" datetime={entry.created_at}>
      {formatDisplayDate(entry.created_at)}
    </time>
  </div>
</article>

<style>
  .note-card {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--card-border, #e2e8f0);
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 12px;
    break-inside: avoid;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .note-card:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 2px;
  }

  .note-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .note-card__tag {
    display: inline-block;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-color, #1d4ed8);
    font-size: 0.7rem;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 9999px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .note-card__preview {
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-primary, #1e293b);
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
  }

  .note-card__meta {
    display: flex;
    justify-content: flex-end;
  }

  .note-card__date {
    font-size: 0.75rem;
    color: var(--text-secondary, #64748b);
  }
</style>
