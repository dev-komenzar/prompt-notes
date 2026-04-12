<!-- @generated-from: docs/detailed_design/grid_search_design.md §4.3 -->
<script lang="ts">
  import { filtersStore, resetFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap(n => n.tags))].sort();

  function toggleTag(tag: string): void {
    filtersStore.update(f => ({
      ...f,
      tags: f.tags?.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...(f.tags ?? []), tag],
    }));
  }
</script>

<div class="filter-bar">
  <SearchInput />
  {#if allTags.length > 0}
    <div class="tag-chips">
      {#each allTags as tag (tag)}
        <button
          class="chip"
          class:active={$filtersStore.tags?.includes(tag) ?? false}
          on:click={() => toggleTag(tag)}
        >{tag}</button>
      {/each}
    </div>
  {/if}
  <div class="date-range">
    <input
      type="date"
      value={$filtersStore.date_from ?? ''}
      aria-label="開始日"
      on:change={(e) => filtersStore.update(f => ({ ...f, date_from: e.currentTarget.value }))}
    />
    <span class="sep">〜</span>
    <input
      type="date"
      value={$filtersStore.date_to ?? ''}
      aria-label="終了日"
      on:change={(e) => filtersStore.update(f => ({ ...f, date_to: e.currentTarget.value }))}
    />
  </div>
  <button class="reset-btn" on:click={resetFilters}>クリア</button>
</div>

<style>
  .filter-bar {
    display: flex; flex-wrap: wrap; gap: 8px;
    padding: 10px 16px; background: #f7fafc;
    border-bottom: 1px solid #e2e8f0; align-items: center; flex-shrink: 0;
  }
  .tag-chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    padding: 3px 10px; border-radius: 16px;
    border: 1px solid #e2e8f0; background: #fff;
    color: #4a5568; font-size: 12px; cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .chip.active { background: #4299e1; color: #fff; border-color: #4299e1; }
  .date-range { display: flex; align-items: center; gap: 4px; font-size: 13px; }
  .sep { color: #718096; }
  input[type="date"] {
    border: 1px solid #e2e8f0; border-radius: 4px;
    padding: 4px 6px; font-size: 13px; color: #2d3748; background: #fff;
  }
  .reset-btn {
    padding: 4px 10px; border: 1px solid #e2e8f0; border-radius: 4px;
    background: #fff; color: #718096; font-size: 12px; cursor: pointer;
  }
  .reset-btn:hover { background: #fff5f5; color: #f56565; border-color: #f56565; }
</style>
