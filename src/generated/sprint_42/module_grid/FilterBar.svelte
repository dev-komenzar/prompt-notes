// @generated-from: docs/detailed_design/grid_search_design.md
// @sprint: 42
```

```svelte
<script lang="ts">
  import { filtersStore, resetFilters } from './filters';
  import { notesStore } from './notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap((n) => n.tags))].sort();

  function toggleTag(tag: string): void {
    filtersStore.update((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }
</script>

<div class="filter-bar">
  <SearchInput />
  <div class="tag-chips">
    {#each allTags as tag}
      <button
        class="chip"
        class:active={$filtersStore.tags.includes(tag)}
        on:click={() => toggleTag(tag)}
      >
        {tag}
      </button>
    {/each}
  </div>
  <div class="date-range">
    <input type="date" bind:value={$filtersStore.date_from} />
    <span>〜</span>
    <input type="date" bind:value={$filtersStore.date_to} />
  </div>
  <button class="clear-btn" on:click={resetFilters}>クリア</button>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }
  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    padding: 4px 10px;
    border-radius: 16px;
    border: 1px solid var(--border-color, #cbd5e0);
    background: transparent;
    cursor: pointer;
    font-size: 13px;
  }
  .chip.active {
    background: var(--accent-color, #4a6fa5);
    color: #fff;
    border-color: var(--accent-color, #4a6fa5);
  }
  .date-range {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .date-range input[type='date'] {
    padding: 4px 8px;
    border: 1px solid var(--border-color, #cbd5e0);
    border-radius: 4px;
    font-size: 13px;
  }
  .clear-btn {
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid var(--border-color, #cbd5e0);
    background: transparent;
    cursor: pointer;
    font-size: 13px;
  }
</style>
