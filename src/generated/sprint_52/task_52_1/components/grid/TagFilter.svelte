<!-- CoDD Trace: plan:implementation_plan > sprint:52 > task:52-1 -->
<!-- Module: components/grid/TagFilter — Tag chip selection UI for grid filtering -->
<!-- CONV: タグフィルタは必須機能。未実装ならリリース不可。 -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];
  export let selected: string | undefined = undefined;

  const dispatch = createEventDispatcher<{ 'tag-change': { tag: string | undefined } }>();

  function selectTag(tag: string): void {
    if (selected === tag) {
      selected = undefined;
    } else {
      selected = tag;
    }
    dispatch('tag-change', { tag: selected });
  }

  function clearTag(): void {
    selected = undefined;
    dispatch('tag-change', { tag: undefined });
  }
</script>

<div class="tag-filter" role="group" aria-label="タグフィルタ">
  {#if tags.length > 0}
    <button
      class="tag-chip"
      class:active={selected === undefined}
      on:click={clearTag}
      aria-pressed={selected === undefined}
    >
      すべて
    </button>
    {#each tags as tag}
      <button
        class="tag-chip"
        class:active={selected === tag}
        on:click={() => selectTag(tag)}
        aria-pressed={selected === tag}
      >
        {tag}
      </button>
    {/each}
  {/if}
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
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 9999px;
    background-color: var(--chip-bg, #ffffff);
    color: var(--text-color, #475569);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .tag-chip:hover {
    background-color: var(--hover-bg, #f1f5f9);
  }

  .tag-chip.active {
    background-color: var(--primary-color, #3b82f6);
    color: #ffffff;
    border-color: var(--primary-color, #3b82f6);
  }

  .tag-chip.active:hover {
    background-color: var(--primary-dark, #2563eb);
  }
</style>
