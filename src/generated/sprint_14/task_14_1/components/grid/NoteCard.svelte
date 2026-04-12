<!-- @generated-from: docs/detailed_design/grid_search_design.md §4.2 -->
<!-- RBC-GRID-3: card click → editor navigation is release-blocking -->
<script lang="ts">
  import type { NoteMetadata } from '../../lib/types';

  export let note: NoteMetadata;

  function handleClick(): void {
    window.location.hash = `#/?note=${note.id}`;
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
  }

  function fmt(iso: string): string {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<div
  class="note-card"
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-label={`ノート: ${note.preview || '空'}`}
>
  <p class="preview">{note.preview || '（空）'}</p>
  {#if note.tags.length > 0}
    <div class="tags">
      {#each note.tags as tag (tag)}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}
  <time class="date">{fmt(note.created_at)}</time>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    border-radius: 8px;
    background: #fff;
    padding: 16px;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    transition: box-shadow 0.2s ease;
  }
  .note-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .note-card:focus { outline: 2px solid #4299e1; outline-offset: 2px; }
  .preview {
    font-size: 14px; color: #2d3748; margin: 0 0 8px;
    line-height: 1.5; white-space: pre-wrap; word-break: break-word;
  }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
  .tag { font-size: 11px; background: #bee3f8; color: #2b6cb0; border-radius: 4px; padding: 2px 6px; }
  .date { display: block; font-size: 11px; color: #718096; }
</style>
