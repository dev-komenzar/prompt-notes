<!-- @generated-from: docs/detailed_design/grid_search_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import type { NoteMetadata } from '../../lib/types';
  import { selectedNoteId } from '../../stores/notes';
  import { push } from 'svelte-spa-router';

  export let note: NoteMetadata;

  function handleClick() {
    selectedNoteId.set(note.id);
    push('/');
  }

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<div
  class="note-card"
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
  <p class="preview">{note.preview || '（空のノート）'}</p>
  {#if note.tags.length > 0}
    <div class="tags">
      {#each note.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}
  <time class="created-at">{formatDate(note.created_at)}</time>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    padding: 16px;
    background: var(--card-bg, #fff);
    border-radius: 8px;
    border: 1px solid var(--border-color, #e2e8f0);
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.1s ease;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .preview {
    font-size: 13px;
    color: var(--text, #2d3748);
    line-height: 1.6;
    margin: 0 0 10px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tag {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--tag-bg, #bee3f8);
    color: var(--tag-color, #2b6cb0);
    border-radius: 10px;
  }

  .created-at {
    font-size: 11px;
    color: var(--muted, #718096);
    display: block;
  }
</style>
