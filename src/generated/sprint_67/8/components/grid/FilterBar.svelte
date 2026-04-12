<!-- @traceability: detail:grid_search §4.3, §3.2 (RBC-GRID-1, RBC-GRID-2) -->
<script lang="ts">
  import { filtersStore, resetFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap((n) => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update((f) => ({
      ...f,
      tags: f.tags?.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...(f.tags ?? []), tag],
    }));
  }
</script>

<div class="filter-bar">
  <SearchInput />
  {#if allTags.length > 0}
    <div class="tag-chips">
      {#each allTags as tag}
        <button
          class="chip"
          class:active={$filtersStore.tags?.includes(tag)}
          on:click={() => toggleTag(tag)}
        >
          {tag}
        </button>
      {/each}
    </div>
  {/if}
  <div class="date-range">
    <label>
      From
      <input
        type="date"
        bind:value={$filtersStore.date_from}
        on:change={() => filtersStore.update((f) => ({ ...f }))}
      />
    </label>
    <span>〜</span>
    <label>
      To
      <input
        type="date"
        bind:value={$filtersStore.date_to}
        on:change={() => filtersStore.update((f) => ({ ...f }))}
      />
    </label>
  </div>
  <button class="clear-btn" on:click={resetFilters}>クリア</button>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border, #e2e8f0);
    background: var(--surface, #f8fafc);
  }
  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    padding: 4px 10px;
    border-radius: 16px;
    border: 1px solid var(--border, #e2e8f0);
    background: var(--chip-bg, #fff);
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s, color 0.15s;
  }
  .chip.active {
    background: var(--accent, #4f46e5);
    color: white;
    border-color: var(--accent, #4f46e5);
  }
  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  .date-range label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }
  .date-range input[type='date'] {
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    background: var(--input-bg, #fff);
    color: var(--text, #1e293b);
  }
  .clear-btn {
    padding: 4px 12px;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 4px;
    background: var(--surface, #fff);
    font-size: 12px;
    cursor: pointer;
    color: var(--text-secondary, #64748b);
    transition: background 0.15s;
  }
  .clear-btn:hover {
    background: var(--hover-bg, #f1f5f9);
  }
</style>
