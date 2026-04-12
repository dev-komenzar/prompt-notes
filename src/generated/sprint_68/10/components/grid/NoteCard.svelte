<script lang="ts">
  import { push } from 'svelte-spa-router';
  import type { NoteMetadata } from '../../lib/types';

  export let note: NoteMetadata;

  function handleClick() {
    push(`/?note=${note.id}`);
  }

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<div
  class="note-card"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabindex="0"
>
  <p class="preview">{note.preview || '(空のノート)'}</p>
  {#if note.tags.length > 0}
    <div class="tags">
      {#each note.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}
  <time class="date">{formatDate(note.created_at)}</time>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    border-radius: 8px;
    background: var(--card-bg, #ffffff);
    padding: 16px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border-color, #e2e8f0);
    transition: box-shadow 0.2s ease, transform 0.1s ease;
    display: block;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  .note-card:active {
    transform: translateY(0);
  }

  .note-card:focus-visible {
    outline: 2px solid var(--accent-color, #3b82f6);
    outline-offset: 2px;
  }

  .preview {
    font-size: 13px;
    color: var(--text-color, #334155);
    margin: 0 0 10px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 10px;
  }

  .tag {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--tag-bg, #dbeafe);
    color: var(--tag-color, #1e40af);
    border-radius: 10px;
  }

  .date {
    font-size: 11px;
    color: var(--muted-color, #94a3b8);
    display: block;
  }
</style>
