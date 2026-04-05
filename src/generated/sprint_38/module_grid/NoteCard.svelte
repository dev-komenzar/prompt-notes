<!--
  sprint:38 task:38-1 module:grid — Individual note card component
  Displays body_preview, tags, and created_at. Variable height for Masonry.
  Dispatches card-click with filename for editor navigation (CONV-GRID-3).
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteEntry } from './types';
  import { formatCreatedAt } from './utils';

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
  aria-label="ノートを開く: {note.filename}"
>
  {#if note.body_preview}
    <div class="card-preview">{note.body_preview}</div>
  {:else}
    <div class="card-preview card-empty">（空のノート）</div>
  {/if}

  {#if note.tags.length > 0}
    <div class="card-tags">
      {#each note.tags as tag}
        <span class="card-tag">{tag}</span>
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
    padding: 14px 16px;
    border: 1px solid var(--card-border, #e2e8f0);
    border-radius: 8px;
    background: var(--card-bg, #ffffff);
    cursor: pointer;
    transition: box-shadow 0.15s ease, border-color 0.15s ease;
    outline: none;
  }

  .note-card:hover {
    border-color: var(--card-hover-border, #cbd5e0);
    box-shadow: 0 2px 8px var(--card-shadow, rgba(0, 0, 0, 0.06));
  }

  .note-card:focus-visible {
    border-color: var(--grid-focus, #3b82f6);
    box-shadow: 0 0 0 2px var(--grid-focus-ring, rgba(59, 130, 246, 0.2));
  }

  .card-preview {
    font-size: 14px;
    line-height: 1.6;
    color: var(--card-text, #2d3748);
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
  }

  .card-empty {
    color: var(--grid-muted, #a0aec0);
    font-style: italic;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .card-tag {
    display: inline-block;
    padding: 2px 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--tag-text, #4a5568);
    background: var(--tag-bg, #edf2f7);
    border-radius: 4px;
    pointer-events: none;
  }

  .card-footer {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--card-divider, #f0f0f0);
  }

  .card-date {
    font-size: 12px;
    color: var(--grid-muted, #a0aec0);
  }
</style>
