<!--
  sprint:42 task:42-1 module:grid
  Individual note card for masonry grid.
  Variable height based on body_preview length (CONV-GRID-1).
  Click dispatches card-click with filename for editor navigation (CONV-GRID-3).
  Presentational only — no IPC calls.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatCreatedAtDisplay } from './date_utils';
  import type { NoteEntry } from './types';

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
      dispatch('card-click', { filename: note.filename });
    }
  }
</script>

<article
  class="note-card"
  role="button"
  tabindex="0"
  aria-label="ノート {note.filename} を開く"
  on:click={handleClick}
  on:keydown={handleKeydown}
>
  <div class="note-card-body">
    <p class="note-card-preview">{note.body_preview}</p>
  </div>
  {#if note.tags.length > 0}
    <div class="note-card-tags">
      {#each note.tags as tag}
        <span class="tag-badge">{tag}</span>
      {/each}
    </div>
  {/if}
  <div class="note-card-footer">
    <time class="note-card-date" datetime={note.created_at}>
      {formatCreatedAtDisplay(note.created_at)}
    </time>
  </div>
</article>

<style>
  .note-card {
    display: flex;
    flex-direction: column;
    break-inside: avoid;
    margin-bottom: 16px;
    padding: 14px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    background: var(--card-bg, #ffffff);
    cursor: pointer;
    transition: box-shadow 0.15s, border-color 0.15s;
    outline: none;
  }

  .note-card:hover {
    border-color: var(--accent-color, #3b82f6);
    box-shadow: 0 2px 8px var(--shadow-color, rgba(0, 0, 0, 0.06));
  }

  .note-card:focus-visible {
    border-color: var(--accent-color, #3b82f6);
    box-shadow: 0 0 0 2px var(--accent-ring, rgba(59, 130, 246, 0.3));
  }

  .note-card-body {
    flex: 1;
  }

  .note-card-preview {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-color, #334155);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .note-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .tag-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-color, #3b82f6);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.4;
  }

  .note-card-footer {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--border-light, #f1f5f9);
  }

  .note-card-date {
    font-size: 11px;
    color: var(--text-muted, #94a3b8);
  }
</style>
