<script lang="ts">
  // @codd-trace: detail:grid_search §4.3
  import { filtersStore, resetFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import SearchInput from './SearchInput.svelte';

  // notesStore の全ノートからユニークタグを収集
  $: allTags = [...new Set($notesStore.flatMap(n => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update(f => ({
      ...f,
      tags: f.tags?.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...(f.tags ?? []), tag],
    }));
  }

  function handleDateFromChange(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_from: value }));
  }

  function handleDateToChange(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_to: value }));
  }
</script>

<div class="filter-bar" role="search">
  <div class="search-row">
    <SearchInput />
  </div>
  {#if allTags.length > 0}
    <div class="tag-chips" aria-label="タグフィルタ">
      {#each allTags as tag}
        <button
          class="chip"
          class:active={$filtersStore.tags?.includes(tag)}
          on:click={() => toggleTag(tag)}
          type="button"
          aria-pressed={$filtersStore.tags?.includes(tag) ?? false}
        >
          {tag}
        </button>
      {/each}
    </div>
  {/if}
  <div class="date-range" aria-label="日付範囲フィルタ">
    <label>
      <span class="sr-only">開始日</span>
      <input
        type="date"
        value={$filtersStore.date_from ?? ''}
        on:change={handleDateFromChange}
      />
    </label>
    <span aria-hidden="true">〜</span>
    <label>
      <span class="sr-only">終了日</span>
      <input
        type="date"
        value={$filtersStore.date_to ?? ''}
        on:change={handleDateToChange}
      />
    </label>
  </div>
  <button class="clear-btn" on:click={resetFilters} type="button">
    クリア
  </button>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 10px 16px;
    background: var(--filter-bg, #f7fafc);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }
  .search-row {
    width: 240px;
    min-width: 160px;
  }
  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .chip {
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--chip-bg, #fff);
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s, color 0.15s;
  }
  .chip.active {
    background: var(--chip-active-bg, #4299e1);
    color: #fff;
    border-color: transparent;
  }
  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  .date-range input[type='date'] {
    padding: 4px 8px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    font-size: 13px;
    background: var(--input-bg, #fff);
  }
  .clear-btn {
    padding: 4px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    background: var(--btn-bg, #fff);
    cursor: pointer;
    font-size: 13px;
  }
  .clear-btn:hover {
    background: var(--btn-hover-bg, #edf2f7);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
