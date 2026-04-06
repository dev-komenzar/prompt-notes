<!-- CoDD Trace: plan:implementation_plan > sprint:52 > task:52-1 -->
<!-- Module: components/grid/NoteCard — Individual card in Pinterest-style masonry grid -->
<!-- CONV: カードクリックでエディタ画面へ遷移必須。 -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteEntry } from '../../lib/types';
  import { formatDisplayDate } from '../../lib/dateUtils';

  export let note: NoteEntry;

  const dispatch = createEventDispatcher<{ 'card-click': { filename: string } }>();

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
  {#if note.tags.length > 0}
    <div class="card-tags">
      {#each note.tags as tag}
        <span class="tag-badge">{tag}</span>
      {/each}
    </div>
  {/if}
  <div class="card-preview">
    {note.body_preview || '(空のノート)'}
  </div>
  <div class="card-date">
    {formatDisplayDate(note.created_at)}
  </div>
</article>

<style>
  .note-card {
    background-color: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    padding: 14px;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.1s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .note-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  .note-card:focus-visible {
    outline: 2px solid var(--primary-color, #3b82f6);
    outline-offset: 2px;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    background-color: var(--tag-bg, rgba(59, 130, 246, 0.1));
    color: var(--tag-color, #3b82f6);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.5;
  }

  .card-preview {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-color, #334155);
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
  }

  .card-date {
    font-size: 11px;
    color: var(--text-muted, #94a3b8);
    margin-top: auto;
  }
</style>
