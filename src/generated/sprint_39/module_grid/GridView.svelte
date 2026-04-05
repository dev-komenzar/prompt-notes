<!--
  sprint:39 task:39-1 module:grid
  CONV-GRID-1: Pinterest-style masonry cards. Default 7-day filter on mount.
  CONV-GRID-2: Tag/date filter and full-text search (all via IPC, no client-side).
  CONV-GRID-3: Card click navigates to module:editor.
  CONV-IPC: No direct invoke(). All IPC via api.ts wrappers.
-->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { createGridStore } from './grid-store';
  import { debounce } from './debounce';
  import NoteCard from './NoteCard.svelte';
  import TagFilter from './TagFilter.svelte';
  import DateFilter from './DateFilter.svelte';

  const dispatch = createEventDispatcher<{
    navigate: { view: 'editor'; filename: string };
  }>();

  const store = createGridStore();

  let searchInput = '';

  const debouncedSearch = debounce((query: string) => {
    store.setQuery(query);
  }, 300);

  function handleSearchInput(): void {
    debouncedSearch(searchInput);
  }

  function handleClearSearch(): void {
    searchInput = '';
    debouncedSearch.cancel();
    store.setQuery('');
  }

  function handleCardClick(event: CustomEvent<{ filename: string }>): void {
    dispatch('navigate', { view: 'editor', filename: event.detail.filename });
  }

  function handleTagChange(event: CustomEvent<{ tag: string | undefined }>): void {
    store.setTag(event.detail.tag);
  }

  function handleDateChange(
    event: CustomEvent<{ from_date: string; to_date: string }>,
  ): void {
    store.setDateRange(event.detail.from_date, event.detail.to_date);
  }

  function handleResetFilters(): void {
    searchInput = '';
    debouncedSearch.cancel();
    store.resetFilters();
  }

  onMount(() => {
    store.init();
  });

  onDestroy(() => {
    debouncedSearch.cancel();
  });
</script>

<div class="grid-view">
  <header class="grid-toolbar">
    <div class="search-box">
      <input
        type="text"
        class="search-input"
        placeholder="全文検索..."
        bind:value={searchInput}
        on:input={handleSearchInput}
        aria-label="全文検索"
      />
      {#if searchInput}
        <button
          class="search-clear"
          on:click={handleClearSearch}
          aria-label="検索クリア"
        >✕</button>
      {/if}
    </div>

    <div class="filters">
      <TagFilter
        tags={$store.availableTags}
        selectedTag={$store.filters.tag}
        on:tag-change={handleTagChange}
      />
      <DateFilter
        fromDate={$store.filters.from_date}
        toDate={$store.filters.to_date}
        on:date-change={handleDateChange}
      />
      <button
        class="reset-filters"
        on:click={handleResetFilters}
        aria-label="フィルタリセット"
      >リセット</button>
    </div>
  </header>

  <main class="grid-content">
    {#if $store.loading}
      <div class="grid-loading" role="status" aria-label="読み込み中">
        <span class="loading-spinner"></span>
        <span>読み込み中...</span>
      </div>
    {:else if $store.error}
      <div class="grid-error" role="alert">
        <p class="error-message">{$store.error}</p>
        <button class="retry-button" on:click={() => store.refresh()}>
          再試行
        </button>
      </div>
    {:else if $store.notes.length === 0}
      <div class="grid-empty">
        <p>ノートが見つかりません</p>
      </div>
    {:else}
      <div class="masonry-grid">
        {#each $store.notes as note (note.filename)}
          <NoteCard {note} on:card-click={handleCardClick} />
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .grid-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .grid-toolbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    background: var(--toolbar-bg, #f8fafc);
    flex-shrink: 0;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 8px 36px 8px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #1e293b);
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    border-color: var(--focus-color, #3b82f6);
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(59, 130, 246, 0.2));
  }

  .search-input::placeholder {
    color: var(--placeholder-color, #94a3b8);
  }

  .search-clear {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted, #64748b);
    font-size: 14px;
    padding: 4px;
    line-height: 1;
  }

  .filters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .reset-filters {
    padding: 6px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    color: var(--text-muted, #64748b);
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
  }

  .reset-filters:hover {
    background: var(--button-hover-bg, #f1f5f9);
    color: var(--text-color, #1e293b);
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .masonry-grid {
    column-width: 280px;
    column-gap: 16px;
  }

  .grid-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 16px;
    color: var(--text-muted, #64748b);
  }

  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color, #e2e8f0);
    border-top-color: var(--focus-color, #3b82f6);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .grid-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 48px 16px;
  }

  .error-message {
    color: var(--error-color, #ef4444);
    font-size: 14px;
    margin: 0;
  }

  .retry-button {
    padding: 8px 16px;
    border: 1px solid var(--focus-color, #3b82f6);
    border-radius: 6px;
    background: var(--focus-color, #3b82f6);
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
  }

  .retry-button:hover {
    opacity: 0.9;
  }

  .grid-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    color: var(--text-muted, #64748b);
    font-size: 14px;
  }
</style>
