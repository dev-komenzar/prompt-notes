<script lang="ts">
  import { debounce } from '../utils/debounce';
  import {
    getNotesState,
    setSearchQuery,
    setDateRange,
    performSearch,
    loadNotes
  } from '../stores/notes.svelte';

  const state = getNotesState();

  const debouncedSearch = debounce(() => {
    if (state.searchQuery.trim()) {
      performSearch();
    } else {
      loadNotes();
    }
  }, 300);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    setSearchQuery(target.value);
    debouncedSearch();
  }

  function handleDateFromChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setDateRange(target.value, state.dateTo);
    if (state.searchQuery.trim()) {
      performSearch();
    } else {
      loadNotes();
    }
  }

  function handleDateToChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setDateRange(state.dateFrom, target.value);
    if (state.searchQuery.trim()) {
      performSearch();
    } else {
      loadNotes();
    }
  }
</script>

<div class="search-bar">
  <div class="search-input-wrapper">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      class="search-input"
      data-testid="search-input"
      aria-label="ノートを検索"
      placeholder="ノートを検索..."
      value={state.searchQuery}
      oninput={handleInput}
    />
  </div>

  <div class="date-filters" data-testid="date-filter">
    <input
      type="date"
      class="date-input"
      aria-label="日付フィルタ開始"
      value={state.dateFrom}
      onchange={handleDateFromChange}
    />
    <span class="date-separator">〜</span>
    <input
      type="date"
      class="date-input"
      aria-label="日付フィルタ終了"
      value={state.dateTo}
      onchange={handleDateToChange}
    />
  </div>
</div>

<style>
  .search-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 200px;
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    padding: 0 12px;
  }

  .search-icon {
    font-size: 14px;
    margin-right: 8px;
    color: var(--color-text-muted);
  }

  .search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--color-text);
    font-size: 14px;
    padding: 8px 0;
    font-family: var(--font-sans);
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
  }

  .date-filters {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .date-input {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    padding: 6px 10px;
    font-size: 13px;
    font-family: var(--font-sans);
    outline: none;
  }

  .date-input:focus {
    border-color: var(--color-primary);
  }

  .date-separator {
    color: var(--color-text-muted);
    font-size: 13px;
  }
</style>
