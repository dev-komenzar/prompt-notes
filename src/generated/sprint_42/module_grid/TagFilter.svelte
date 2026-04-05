<!--
  sprint:42 task:42-1 module:grid
  Tag filter UI (CONV-GRID-2).
  Single-tag selection. Dispatches tag-change event.
  Tags are dynamically collected from NoteEntry[].
  Presentational only — no IPC calls.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];
  export let selectedTag: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    'tag-change': { tag: string | undefined };
  }>();

  function handleSelect(tag: string | undefined): void {
    selectedTag = tag;
    dispatch('tag-change', { tag });
  }
</script>

<div class="tag-filter" role="group" aria-label="タグフィルタ">
  <button
    class="tag-chip"
    class:active={selectedTag === undefined}
    on:click={() => handleSelect(undefined)}
    aria-pressed={selectedTag === undefined}
  >
    すべて
  </button>
  {#each tags as tag}
    <button
      class="tag-chip"
      class:active={selectedTag === tag}
      on:click={() => handleSelect(tag)}
      aria-pressed={selectedTag === tag}
    >
      {tag}
    </button>
  {/each}
</div>

<style>
  .tag-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 16px;
    background: var(--chip-bg, #f8fafc);
    color: var(--text-color, #475569);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    white-space: nowrap;
    line-height: 1.4;
  }

  .tag-chip:hover {
    background: var(--chip-hover-bg, #e2e8f0);
  }

  .tag-chip.active {
    background: var(--accent-color, #3b82f6);
    border-color: var(--accent-color, #3b82f6);
    color: #ffffff;
  }

  .tag-chip.active:hover {
    background: var(--accent-hover, #2563eb);
    border-color: var(--accent-hover, #2563eb);
  }

  .tag-chip:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-ring, rgba(59, 130, 246, 0.3));
  }
</style>
