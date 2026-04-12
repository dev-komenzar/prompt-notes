<script lang="ts">
  // @generated-from: docs/detailed_design/grid_search_design.md
  // Sprint 43: NoteCard click → push('/?note={id}') → EditorView readNote(id)
  import type { NoteMetadata } from '$lib/types';
  import { push } from 'svelte-spa-router';

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
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<div
  class="note-card"
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
>
  <p class="preview">{note.preview}</p>
  {#if note.tags.length > 0}
    <div class="tags">
      {#each note.tags as tag (tag)}
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
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s ease;
    border: 1px solid var(--border-color, #e2e8f0);
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .note-card:focus {
    outline: 2px solid var(--focus-color, #4299e1);
    outline-offset: 2px;
  }

  .preview {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-primary, #2d3748);
    margin: 0 0 8px 0;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tag {
    font-size: 12px;
    background: var(--tag-bg, #ebf4ff);
    color: var(--tag-color, #3182ce);
    padding: 2px 8px;
    border-radius: 12px;
  }

  .created-at {
    font-size: 12px;
    color: var(--text-secondary, #718096);
    display: block;
    text-align: right;
  }
</style>
