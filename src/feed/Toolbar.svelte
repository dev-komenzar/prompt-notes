<script lang="ts">
  import SearchBar from "./SearchBar.svelte";
  import TagFilter from "./TagFilter.svelte";
  import DateFilter from "./DateFilter.svelte";
  import { filters, setQuery, toggleTag, setDateRange, resetFilters } from "$lib/feed/filters";
  import { listAllTags } from "$lib/shell/tauri-commands";
  import { handleCommandError } from "$lib/shell/error-handler";

  interface Props {
    allTags: string[];
  }

  let { allTags }: Props = $props();
  let globalTags = $state<string[]>([]);

  let isDefaultFilter = $derived(
    $filters.tags.length === 0 && $filters.query.trim() === ""
  );

  let displayedTags = $derived(isDefaultFilter ? globalTags : allTags);

  $effect(() => {
    if (isDefaultFilter) {
      listAllTags()
        .then((tags) => { globalTags = tags; })
        .catch((err) => handleCommandError(err));
    }
  });
</script>

<div class="toolbar" data-testid="toolbar">
  <SearchBar onSearch={setQuery} query={$filters.query} />
  <div class="toolbar-filters">
    <TagFilter
      tags={displayedTags}
      selectedTags={$filters.tags}
      onToggle={toggleTag}
    />
    <DateFilter
      fromDate={$filters.fromDate}
      toDate={$filters.toDate}
      onChange={setDateRange}
    />
    <button class="reset-btn" onclick={resetFilters}>Reset</button>
  </div>
</div>

<style>
  .toolbar {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }
  .toolbar-filters {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .reset-btn {
    padding: 4px 10px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    color: var(--text-secondary);
    border: 1px solid var(--border);
  }
  .reset-btn:hover {
    background: var(--surface-secondary);
  }
</style>
