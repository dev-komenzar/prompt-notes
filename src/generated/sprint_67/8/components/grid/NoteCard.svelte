<!-- @traceability: detail:grid_search §4.2 (RBC-GRID-3) -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '../../lib/types';

  export let note: NoteMetadata;

  const dispatch = createEventDispatcher<{ select: string }>();

  function handleClick() {
    dispatch('select', note.id);
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
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
    border-radius: 8px;
    background: var(--card-bg, #fff);
    border: 1px solid var(--border, #e2e8f0);
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.1s;
  }
  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  .preview {
    font-size: 13px;
    color: var(--text, #1e293b);
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
    background: var(--tag-bg, #dbeafe);
    color: var(--tag-color, #1d4ed8);
    border-radius: 4px;
    padding: 2px 6px;
  }
  .created-at {
    font-size: 11px;
    color: var(--text-muted, #94a3b8);
    display: block;
  }
</style>
