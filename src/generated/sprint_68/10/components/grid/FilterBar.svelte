<script lang="ts">
  import { filtersStore, resetFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap(n => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag],
    }));
  }

  function handleDateFromChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_from: value }));
  }

  function handleDateToChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_to: value }));
  }
</script>

<div class="filter-bar" role="search">
  <SearchInput />

  {#if allTags.length > 0}
    <div class="tag-chips" role="group" aria-label="タグフィルタ">
      {#each allTags as tag}
        <button
          class="chip"
          class:active={$filtersStore.tags.includes(tag)}
          on:click={() => toggleTag(tag)}
          aria-pressed={$filtersStore.tags.includes(tag)}
        >
          {tag}
        </button>
      {/each}
    </div>
  {/if}

  <div class="date-range" aria-label="日付範囲フィルタ">
    <input
      type="date"
      value={$filtersStore.date_from}
      on:change={handleDateFromChange}
      aria-label="開始日"
    />
    <span class="sep" aria-hidden="true">〜</span>
    <input
      type="date"
      value={$filtersStore.date_to}
      on:change={handleDateToChange}
      aria-label="終了日"
    />
  </div>

  <button class="clear-btn" on:click={resetFilters}>
    クリア
  </button>
</div>

<style>
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: var(--filter-bar-bg, #f8fafc);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 4px 12px;
    border-radius: 16px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--chip-bg, #ffffff);
    color: var(--text-color, #334155);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.1s, color 0.1s, border-color 0.1s;
  }

  .chip:hover {
    border-color: var(--accent-color, #3b82f6);
    color: var(--accent-color, #3b82f6);
  }

  .chip.active {
    background: var(--accent-color, #3b82f6);
    color: white;
    border-color: var(--accent-color, #3b82f6);
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .date-range input {
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    color: var(--text-color, #334155);
    background: var(--input-bg, #ffffff);
    outline: none;
  }

  .date-range input:focus {
    border-color: var(--accent-color, #3b82f6);
  }

  .sep {
    font-size: 12px;
    color: var(--muted-color, #94a3b8);
  }

  .clear-btn {
    padding: 4px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    background: var(--clear-btn-bg, #ffffff);
    color: var(--muted-color, #94a3b8);
    font-size: 12px;
    cursor: pointer;
    transition: color 0.1s;
    margin-left: auto;
  }

  .clear-btn:hover {
    color: var(--text-color, #334155);
    border-color: var(--text-color, #334155);
  }
</style>
