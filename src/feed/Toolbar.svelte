<script lang="ts">
  import TagFilter from "./TagFilter.svelte";
  import DateFilter from "./DateFilter.svelte";
  import { filters, resetFilters } from "./filters";
  import { totalCount } from "./totalCount";
  import { listAllTags } from "../shell/tauri-commands";
  import { onMount } from "svelte";

  let allTags = $state<string[]>([]);

  onMount(async () => {
    try {
      allTags = await listAllTags();
    } catch (_e) {
      allTags = [];
    }
  });

  let hasActiveFilters = $derived(
    $filters.tags.length > 0 ||
      $filters.fromDate !== null ||
      $filters.toDate !== null
  );
</script>

<div class="toolbar" data-testid="toolbar">
  <div class="toolbar-filters">
    <TagFilter tags={allTags} selectedTags={$filters.tags} />
    <DateFilter fromDate={$filters.fromDate} toDate={$filters.toDate} />
    {#if hasActiveFilters}
      <button
        class="toolbar-reset"
        data-testid="reset-filters"
        on:click={resetFilters}
      >
        Reset
      </button>
    {/if}
  </div>
  <div class="toolbar-count" data-testid="total-count">
    {$totalCount} note{$totalCount !== 1 ? "s" : ""}
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--toolbar-height);
    padding: 0 16px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    flex-shrink: 0;
  }

  .toolbar-filters {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-reset {
    font-size: 12px;
    color: var(--accent);
    padding: 2px 8px;
    border-radius: var(--radius);
  }

  .toolbar-reset:hover {
    background: var(--surface-hover);
  }

  .toolbar-count {
    color: var(--text-secondary);
    flex-shrink: 0;
  }
</style>
