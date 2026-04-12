<script lang="ts">
  import { push } from 'svelte-spa-router';
  import type { NoteMetadata } from '$lib/types';

  export let note: NoteMetadata;

  function navigate() {
    push(`/?note=${note.id}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate();
    }
  }

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="note-card"
  role="button"
  tabindex="0"
  on:click={navigate}
  on:keydown={handleKeydown}
>
  <p class="preview">{note.preview}</p>
  {#if note.tags.length > 0}
    <div class="tags">
      {#each note.tags as tag (tag)}
        <span class="tag-chip">{tag}</span>
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
    border: 1px solid var(--card-border, #e2e8f0);
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s ease;
    outline: none;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .note-card:focus-visible {
    box-shadow: 0 0 0 2px var(--focus-ring, #3b82f6);
  }

  .preview {
    margin: 0 0 12px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary, #1a202c);
    word-break: break-word;
    white-space: pre-wrap;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .tag-chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--tag-bg, #e2e8f0);
    color: var(--tag-text, #4a5568);
    font-size: 12px;
    line-height: 1.5;
  }

  .created-at {
    display: block;
    font-size: 12px;
    color: var(--text-muted, #718096);
  }
</style>
