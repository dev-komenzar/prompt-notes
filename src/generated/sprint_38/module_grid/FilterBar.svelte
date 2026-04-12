<script lang="ts">
  import { filtersStore, resetFilters } from './filters';
  import { notesStore } from './notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap((n) => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function handleDateFrom(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_from: value }));
  }

  function handleDateTo(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_to: value }));
  }

  $: hasActiveFilters =
    $filtersStore.tags.length > 0 ||
    $filtersStore.query !== '' ||
    (function () {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const defaultFrom = sevenDaysAgo.toISOString().slice(0, 10);
      const defaultTo = now.toISOString().slice(0, 10);
      return $filtersStore.date_from !== defaultFrom || $filtersStore.date_to !== defaultTo;
    })();
</script>

<div class="filter-bar" role="search" aria-label="フィルター">
  <div class="filter-row">
    <div class="search-section">
      <SearchInput />
    </div>

    <div class="date-range" aria-label="日付範囲">
      <label class="date-label">
        <span class="sr-only">開始日</span>
        <input
          type="date"
          value={$filtersStore.date_from}
          on:change={handleDateFrom}
          aria-label="開始日"
        />
      </label>
      <span class="date-sep" aria-hidden="true">〜</span>
      <label class="date-label">
        <span class="sr-only">終了日</span>
        <input
          type="date"
          value={$filtersStore.date_to}
          on:change={handleDateTo}
          aria-label="終了日"
        />
      </label>
    </div>

    {#if hasActiveFilters}
      <button class="clear-btn" on:click={resetFilters} aria-label="フィルターをリセット">
        クリア
      </button>
    {/if}
  </div>

  {#if allTags.length > 0}
    <div class="tag-chips" role="group" aria-label="タグフィルター">
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
</div>

<style>
  .filter-bar {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--surface-bg, #f9fafb);
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .search-section {
    flex: 1;
    min-width: 180px;
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .date-label {
    display: flex;
    align-items: center;
  }

  input[type='date'] {
    padding: 6px 8px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    font-size: 13px;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #111827);
    cursor: pointer;
    outline: none;
  }

  input[type='date']:focus {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .date-sep {
    font-size: 13px;
    color: var(--text-muted, #6b7280);
  }

  .clear-btn {
    padding: 6px 14px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    font-size: 13px;
    background: var(--input-bg, #ffffff);
    color: var(--text-secondary, #374151);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s ease;
  }

  .clear-btn:hover {
    background: var(--hover-bg, #f3f4f6);
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 4px 12px;
    border-radius: 9999px;
    border: 1px solid var(--border-color, #d1d5db);
    background: var(--input-bg, #ffffff);
    color: var(--text-secondary, #374151);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .chip:hover {
    border-color: var(--color-primary, #3b82f6);
    color: var(--color-primary, #3b82f6);
  }

  .chip.active {
    background: var(--color-primary, #3b82f6);
    border-color: var(--color-primary, #3b82f6);
    color: #ffffff;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
