<!--
  sprint:38 task:38-1 module:grid — Tag filter chip selector (CONV-GRID-2)
  Displays available tags as selectable chips. Dispatches tag-change event.
  Single-tag selection; clicking the active tag or clear button deselects.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];
  export let selected: string = '';

  const dispatch = createEventDispatcher<{
    'tag-change': { tag: string };
  }>();

  function selectTag(tag: string): void {
    const next = tag === selected ? '' : tag;
    dispatch('tag-change', { tag: next });
  }

  function clearTag(): void {
    dispatch('tag-change', { tag: '' });
  }
</script>

{#if tags.length > 0}
  <div class="tag-filter" role="group" aria-label="タグフィルタ">
    {#each tags as tag (tag)}
      <button
        type="button"
        class="tag-chip"
        class:active={tag === selected}
        on:click={() => selectTag(tag)}
        aria-pressed={tag === selected}
      >
        {tag}
      </button>
    {/each}
    {#if selected}
      <button
        type="button"
        class="tag-chip tag-clear"
        on:click={clearTag}
        aria-label="タグフィルタをクリア"
      >
        ✕
      </button>
    {/if}
  </div>
{/if}

<style>
  .tag-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .tag-chip {
    padding: 4px 12px;
    font-size: 13px;
    line-height: 1.4;
    border: 1px solid var(--grid-border, #e2e8f0);
    border-radius: 16px;
    background: var(--grid-input-bg, #ffffff);
    color: var(--grid-text, #4a5568);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease,
      color 0.15s ease;
    outline: none;
  }

  .tag-chip:hover {
    background: var(--tag-hover-bg, #edf2f7);
  }

  .tag-chip:focus-visible {
    border-color: var(--grid-focus, #3b82f6);
    box-shadow: 0 0 0 2px var(--grid-focus-ring, rgba(59, 130, 246, 0.2));
  }

  .tag-chip.active {
    background: var(--tag-active-bg, #3b82f6);
    border-color: var(--tag-active-bg, #3b82f6);
    color: var(--tag-active-text, #ffffff);
  }

  .tag-chip.active:hover {
    background: var(--tag-active-hover, #2563eb);
    border-color: var(--tag-active-hover, #2563eb);
  }

  .tag-clear {
    padding: 4px 8px;
    font-size: 12px;
    color: var(--grid-muted, #a0aec0);
    border-color: transparent;
    background: transparent;
  }

  .tag-clear:hover {
    color: var(--grid-error, #e53e3e);
    background: transparent;
  }
</style>
