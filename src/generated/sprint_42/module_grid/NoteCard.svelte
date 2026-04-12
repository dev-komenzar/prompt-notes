// @generated-from: docs/detailed_design/grid_search_design.md
// @sprint: 42
```

```svelte
<script lang="ts">
  import type { NoteMetadata } from '$lib/types';
  import { push } from 'svelte-spa-router';

  export let note: NoteMetadata;

  function handleClick(): void {
    push(`/?note=${note.id}`);
  }

  function handleKeydown(e: KeyboardEvent): void {
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
    background: var(--card-bg, #ffffff);
    padding: 16px;
    cursor: pointer;
    border: 1px solid var(--border-color, #e2e8f0);
    transition: box-shadow 0.2s ease;
    outline: none;
  }
  .note-card:hover,
  .note-card:focus-visible {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .preview {
    margin: 0 0 8px;
    font-size: 14px;
    line-height: 1.5;
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
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--tag-bg, #edf2f7);
    font-size: 12px;
  }
  .created-at {
    display: block;
    font-size: 12px;
    color: var(--muted-color, #718096);
  }
</style>
