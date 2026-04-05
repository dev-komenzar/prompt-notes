<!--
  sprint:39 task:39-1 module:grid
  CONV-GRID-1: Variable-height card for Pinterest-style masonry layout.
  CONV-GRID-3: Card click dispatches event for editor navigation.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatCreatedAt } from './date-utils';
  import type { NoteEntry } from './types';

  export let note: NoteEntry;

  const dispatch = createEventDispatcher<{
    'card-click': { filename: string };
  }>();

  function handleClick(): void {
    dispatch('card-click', { filename: note.filename });
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
  on:click={handleClick}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
  aria-label="{note.filename} を開く"
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

  <footer class="card-footer">
    <time class="card-date" datetime={note.created_at}>
      {formatCreatedAt(note.created_at)}
    </time>
  </footer>
</article>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    background: var(--card-bg, #ffffff);
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s;
    outline: none;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px var(--shadow-color, rgba(0, 0, 0, 0.08));
    transform: translateY(-1px);
  }

  .note-card:focus-visible {
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(59, 130, 246, 0.4));
  }

  .card-body {
    margin-bottom: 12px;
  }

  .card-preview {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-color, #1e293b);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .tag-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-color, #2563eb);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
  }

  .card-footer {
    display: flex;
    justify-content: flex-end;
  }

  .card-date {
    font-size: 12px;
    color: var(--text-muted, #94a3b8);
  }
</style>
