<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '../../types';

  export let note: NoteMetadata;

  const dispatch = createEventDispatcher<{ click: string }>();

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function handleClick() {
    dispatch('click', note.id);
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
  <time class="created-at" datetime={note.created_at}>{formatDate(note.created_at)}</time>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    border-radius: 8px;
    background: white;
    padding: 16px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    transition: box-shadow 0.2s ease;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .preview {
    font-size: 14px;
    color: #374151;
    line-height: 1.5;
    margin: 0 0 8px 0;
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
    background: #dbeafe;
    color: #1e40af;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .created-at {
    font-size: 11px;
    color: #94a3b8;
  }
</style>
