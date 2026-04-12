<!-- @generated-from: docs/detailed_design/grid_search_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import { filtersStore, resetFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap((n) => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update((f) => ({
      ...f,
      tags: f.tags && f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...(f.tags ?? []), tag],
    }));
  }

  function handleDateFromChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_from: value }));
  }

  function handleDateToChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_to: value }));
  }
</script>

<div class="filter-bar">
  <div class="search-row">
    <SearchInput />
  </div>

  {#if allTags.length > 0}
    <div class="tag-row">
      <span class="row-label">タグ:</span>
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
    </div>
  {/if}

  <div class="date-row">
    <span class="row-label">日付:</span>
    <input
      type="date"
      value={$filtersStore.date_from ?? ''}
      on:change={handleDateFromChange}
      aria-label="開始日"
    />
    <span class="separator">〜</span>
    <input
      type="date"
      value={$filtersStore.date_to ?? ''}
      on:change={handleDateToChange}
      aria-label="終了日"
    />
    <button class="reset-btn" on:click={resetFilters}>リセット</button>
  </div>
</div>

<style>
  .filter-bar {
    padding: 12px 16px;
    background: var(--sidebar-bg, #f7fafc);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .search-row {
    max-width: 400px;
  }

  .tag-row,
  .date-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .row-label {
    font-size: 12px;
    color: var(--muted, #718096);
    flex-shrink: 0;
  }

  .tag-chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .chip {
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    background: var(--chip-bg, #fff);
    color: var(--text, #4a5568);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.1s ease, color 0.1s ease;
  }

  .chip:hover {
    background: var(--hover-bg, #edf2f7);
  }

  .chip.active {
    background: var(--accent, #4299e1);
    color: #fff;
    border-color: var(--accent, #4299e1);
  }

  .date-row input[type='date'] {
    padding: 4px 8px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    font-size: 13px;
    background: var(--input-bg, #fff);
    color: var(--text, #2d3748);
  }

  .separator {
    color: var(--muted, #718096);
    font-size: 13px;
  }

  .reset-btn {
    padding: 4px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    background: var(--chip-bg, #fff);
    color: var(--text, #4a5568);
    font-size: 12px;
    cursor: pointer;
    margin-left: 4px;
  }

  .reset-btn:hover {
    background: var(--hover-bg, #edf2f7);
  }
</style>
