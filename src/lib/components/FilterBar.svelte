<script lang="ts">
  import { selectedTags, allTags, searchQuery } from '$lib/stores';

  let { dateRange, onDateChange, searchValue = '', onSearchInput }:
    {
      dateRange: { from: string; to: string };
      onDateChange: (from: string, to: string) => void;
      searchValue?: string;
      onSearchInput: (e: Event) => void;
    } = $props();

  let tagsList: string[] = $state([]);
  let selected: string[] = $state([]);
  allTags.subscribe(v => tagsList = v);
  selectedTags.subscribe(v => selected = v);

  function toggleTag(tag: string) {
    selectedTags.update(tags => {
      if (tags.includes(tag)) {
        return tags.filter(t => t !== tag);
      }
      return [...tags, tag];
    });
  }

  function handleFromChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onDateChange(target.value, dateRange.to);
  }

  function handleToChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onDateChange(dateRange.from, target.value);
  }
</script>

<div class="filter-bar">
  <div class="search-group">
    <input
      type="text"
      class="search-input"
      placeholder="Search notes..."
      value={searchValue}
      oninput={onSearchInput}
    />
  </div>

  <div class="date-group">
    <input type="date" class="date-input" value={dateRange.from} onchange={handleFromChange} />
    <span class="date-sep">–</span>
    <input type="date" class="date-input" value={dateRange.to} onchange={handleToChange} />
  </div>

  {#if tagsList.length > 0}
    <div class="tags-group">
      {#each tagsList as tag}
        <button
          class="tag-filter"
          class:active={selected.includes(tag)}
          onclick={() => toggleTag(tag)}
        >
          {tag}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .search-group {
    flex: 1;
    min-width: 200px;
  }

  .search-input {
    width: 100%;
    padding: 6px 12px;
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    border-color: var(--color-primary);
  }

  .date-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .date-input {
    padding: 5px 8px;
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    color-scheme: dark;
  }

  .date-sep {
    color: var(--color-text-muted);
    font-size: 12px;
  }

  .tags-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag-filter {
    padding: 3px 8px;
    font-size: 12px;
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    transition: all 0.15s;
  }

  .tag-filter:hover {
    border-color: var(--color-primary);
    color: var(--color-text);
  }

  .tag-filter.active {
    background-color: rgba(137, 180, 250, 0.15);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
</style>
