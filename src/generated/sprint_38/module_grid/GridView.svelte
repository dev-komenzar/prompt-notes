<!--
  sprint:38 task:38-1 module:grid — GridView root component
  Pinterest-style Masonry card layout with default 7-day filter,
  tag/date filters, and full-text search (CONV-GRID-1, CONV-GRID-2).
  Card click dispatches navigate event for editor transition (CONV-GRID-3).
  All data retrieval via api.ts IPC wrappers; no direct filesystem access.
-->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { NoteEntry } from './types';
  import { listNotes, searchNotes } from './api';
  import { debounce } from './debounce';
  import { getDefaultDateRange, extractUniqueTags } from './utils';
  import NoteCard from './NoteCard.svelte';
  import TagFilter from './TagFilter.svelte';
  import DateFilter from './DateFilter.svelte';

  const dispatch = createEventDispatcher<{
    navigate: { view: string; filename: string };
  }>();

  let notes: NoteEntry[] = [];
  let availableTags: string[] = [];
  let loading = false;
  let error: string | null = null;

  const defaultRange = getDefaultDateRange();
  let fromDate: string = defaultRange.fromDate;
  let toDate: string = defaultRange.toDate;
  let selectedTag: string = '';
  let searchQuery: string = '';

  // Monotonic request counter to discard stale IPC responses.
  let requestId = 0;

  /**
   * Core data-fetch routine. Calls search_notes when query is present,
   * otherwise list_notes. When refreshTags is true (mount & date change
   * with tag/search cleared), the response also populates availableTags.
   */
  async function fetchData(refreshTags: boolean): Promise<void> {
    const currentRequestId = ++requestId;
    loading = true;
    error = null;

    try {
      let result: NoteEntry[];

      if (searchQuery.trim()) {
        result = await searchNotes({
          query: searchQuery.trim(),
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          tag: selectedTag || undefined,
        });
      } else {
        result = await listNotes({
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          tag: selectedTag || undefined,
        });
      }

      if (currentRequestId !== requestId) return;

      notes = result;

      if (refreshTags) {
        availableTags = extractUniqueTags(result);
      }
    } catch (e) {
      if (currentRequestId !== requestId) return;
      error = e instanceof Error ? e.message : String(e);
      notes = [];
      if (refreshTags) {
        availableTags = [];
      }
    } finally {
      if (currentRequestId === requestId) {
        loading = false;
      }
    }
  }

  // Search debounce: 300ms per design (OQ-GRID-001 default).
  const debouncedSearch = debounce(() => {
    fetchData(false);
  }, 300);

  function handleTagChange(event: CustomEvent<{ tag: string }>): void {
    selectedTag = event.detail.tag;
    fetchData(false);
  }

  function handleDateChange(
    event: CustomEvent<{ fromDate: string; toDate: string }>,
  ): void {
    fromDate = event.detail.fromDate;
    toDate = event.detail.toDate;
    selectedTag = '';
    searchQuery = '';
    // Refresh tags since date range changed and tag/search are cleared.
    fetchData(true);
  }

  function handleCardClick(
    event: CustomEvent<{ filename: string }>,
  ): void {
    dispatch('navigate', {
      view: 'editor',
      filename: event.detail.filename,
    });
  }

  function handleRetry(): void {
    fetchData(!selectedTag && !searchQuery.trim());
  }

  onMount(() => {
    fetchData(true);
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
        bind:value={searchQuery}
        on:input={() => debouncedSearch()}
        placeholder="全文検索..."
        class="search-input"
        aria-label="全文検索"
      />
    </div>
    <TagFilter
      tags={availableTags}
      selected={selectedTag}
      on:tag-change={handleTagChange}
    />
    <DateFilter
      {fromDate}
      {toDate}
      on:date-change={handleDateChange}
    />
  </header>

  {#if loading}
    <div class="grid-status" role="status" aria-label="読み込み中">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>読み込み中...</span>
    </div>
  {:else if error}
    <div class="grid-status grid-error" role="alert">
      <p>ノートの読み込みに失敗しました</p>
      <p class="error-detail">{error}</p>
      <button class="retry-button" on:click={handleRetry}>再試行</button>
    </div>
  {:else if notes.length === 0}
    <div class="grid-status grid-empty">
      <p>ノートが見つかりません</p>
    </div>
  {:else}
    <div class="masonry-grid">
      {#each notes as note (note.filename)}
        <NoteCard {note} on:card-click={handleCardClick} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .grid-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .grid-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--grid-border, #e2e8f0);
  }

  .search-box {
    flex: 1 1 220px;
    min-width: 180px;
  }

  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--grid-border, #e2e8f0);
    border-radius: 6px;
    font-size: 14px;
    background: var(--grid-input-bg, #ffffff);
    color: var(--grid-text, #1a202c);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(--grid-focus, #3b82f6);
    box-shadow: 0 0 0 2px var(--grid-focus-ring, rgba(59, 130, 246, 0.2));
  }

  .search-input::placeholder {
    color: var(--grid-placeholder, #a0aec0);
  }

  /* CSS Columns Masonry — stable on WebKitGTK and WKWebView */
  .masonry-grid {
    column-count: 3;
    column-gap: 16px;
    column-fill: balance;
  }

  @media (max-width: 900px) {
    .masonry-grid {
      column-count: 2;
    }
  }

  @media (max-width: 520px) {
    .masonry-grid {
      column-count: 1;
    }
  }

  .grid-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 16px;
    color: var(--grid-muted, #718096);
    text-align: center;
  }

  .grid-error {
    color: var(--grid-error, #e53e3e);
  }

  .error-detail {
    font-size: 13px;
    opacity: 0.8;
    max-width: 400px;
    word-break: break-word;
  }

  .retry-button {
    margin-top: 8px;
    padding: 8px 20px;
    border: 1px solid var(--grid-border, #e2e8f0);
    border-radius: 6px;
    background: var(--grid-input-bg, #ffffff);
    color: var(--grid-text, #1a202c);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s ease;
  }

  .retry-button:hover {
    background: var(--grid-hover-bg, #f7fafc);
  }

  .loading-spinner {
    display: inline-block;
    width: 22px;
    height: 22px;
    border: 2px solid var(--grid-border, #e2e8f0);
    border-top-color: var(--grid-focus, #3b82f6);
    border-radius: 50%;
    animation: grid-spin 0.6s linear infinite;
  }

  @keyframes grid-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .grid-empty {
    color: var(--grid-muted, #718096);
  }
</style>
