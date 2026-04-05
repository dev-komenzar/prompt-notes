<!--
  sprint:41 task:41-1 module:grid
  TagFilter — tag chip selection UI (CONV-GRID-2).
  Dispatches 'tag-change' with { tag: string | undefined }.
  Does NOT perform IPC calls; purely presentational.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  /** Sorted unique tags extracted from current NoteEntry results. */
  export let availableTags: string[] = [];
  /** Currently active tag filter; undefined means no filter. */
  export let selectedTag: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    'tag-change': { tag: string | undefined };
  }>();

  function selectTag(tag: string): void {
    if (selectedTag === tag) {
      selectedTag = undefined;
    } else {
      selectedTag = tag;
    }
    dispatch('tag-change', { tag: selectedTag });
  }

  function clearSelection(): void {
    selectedTag = undefined;
    dispatch('tag-change', { tag: undefined });
  }
</script>

{#if availableTags.length > 0}
  <div class="tag-filter" role="group" aria-label="タグフィルタ">
    <span class="tag-filter__label">Tags:</span>
    <div class="tag-filter__chips">
      {#each availableTags as tag (tag)}
        <button
          class="tag-chip"
          class:tag-chip--active={selectedTag === tag}
          type="button"
          aria-pressed={selectedTag === tag}
          on:click={() => selectTag(tag)}
        >
          {tag}
        </button>
      {/each}
      {#if selectedTag !== undefined}
        <button
          class="tag-chip tag-chip--clear"
          type="button"
          on:click={clearSelection}
          aria-label="タグフィルタをクリア"
        >
          ✕
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tag-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tag-filter__label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-secondary, #6b7280);
    white-space: nowrap;
    user-select: none;
  }

  .tag-filter__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
    line-height: 1.25;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 9999px;
    background: var(--chip-bg, #f3f4f6);
    color: var(--text-primary, #374151);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    user-select: none;
  }

  .tag-chip:hover {
    background: var(--chip-hover-bg, #e5e7eb);
    border-color: var(--border-hover-color, #9ca3af);
  }

  .tag-chip:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
  }

  .tag-chip--active {
    background: var(--chip-active-bg, #3b82f6);
    border-color: var(--chip-active-border, #2563eb);
    color: var(--chip-active-text, #ffffff);
  }

  .tag-chip--active:hover {
    background: var(--chip-active-hover-bg, #2563eb);
  }

  .tag-chip--clear {
    background: transparent;
    border-color: var(--border-color, #d1d5db);
    color: var(--text-secondary, #6b7280);
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }

  .tag-chip--clear:hover {
    background: var(--danger-bg, #fee2e2);
    border-color: var(--danger-border, #fca5a5);
    color: var(--danger-text, #dc2626);
  }
</style>
