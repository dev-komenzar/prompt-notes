<!--
  sprint:41 task:41-1 module:grid
  GridView — root component for module:grid.
  Pinterest-style Masonry via CSS Columns (CONV-GRID-1).
  Default 7-day filter (CONV-GRID-1).
  Tag/date filters + full-text search (CONV-GRID-2).
  Card-click editor navigation (CONV-GRID-3).
  All data fetched via api.ts; no direct invoke (CONV-IPC).
  No client-side filtering or searching.
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { NoteEntry } from './types';
  import { listNotes, searchNotes } from './api';
  import { debounce } from './debounce';
  import { getDefaultDateRange } from './date-utils';
  import { collectUniqueTags } from './tag-utils';
  import TagFilter from './TagFilter.svelte';
  import DateFilter from './DateFilter.svelte';
  import NoteCard from './NoteCard.svelte';

  /** Emitted when the user clicks a card to open a note in the editor. */
  const dispatch = createEventDispatcher<{
    'navigate-editor': { filename: string };
  }>();

  // --- State ---------------------------------------------------------------

  let notes: NoteEntry[] = [];
  let availableTags: string[] = [];
  let loading = false;
  let error: string | null = null;

  // Filter state — default 7-day window (CONV-GRID-1)
  const defaults = getDefaultDateRange();
  let fromDate: string = defaults.fromDate;
  let toDate: string = defaults.toDate;
  let selectedTag: string | undefined = undefined;
  let searchQuery: string = '';

  // --- Lifecycle -----------------------------------------------------------

  onMount(() => {
    fetchNotes();
  });

  // --- Data fetching -------------------------------------------------------

  async function fetchNotes(): Promise<void> {
    loading = true;
    error = null;

    try {
      const trimmedQuery = searchQuery.trim();
      let results: NoteEntry[];

      if (trimmedQuery !== '') {
        // Full-text search via Rust file-scan (CONV-GRID-2)
        results = await searchNotes({
          query: trimmedQuery,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          tag: selectedTag,
        });
      } else {
        // Date/tag filtered listing
        results = await listNotes({
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          tag: selectedTag,
        });
      }

      notes = results;
      availableTags = collectUniqueTags(results);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      error = message;
      notes = [];
    } finally {
      loading = false;
    }
  }

  // --- Event handlers ------------------------------------------------------

  function handleTagChange(e: CustomEvent<{ tag: string | undefined }>): void {
    selectedTag = e.detail.tag;
    fetchNotes();
  }

  function handleDateChange(
    e: CustomEvent<{ from_date: string; to_date: string }>,
  ): void {
    fromDate = e.detail.from_date;
    toDate = e.detail.to_date;
    fetchNotes();
  }

  function handleCardClick(e: CustomEvent<{ filename: string }>): void {
    dispatch('navigate-editor', { filename: e.detail.filename });
  }

  // Search debounce: 300 ms (OQ-GRID-001 default)
  const debouncedFetch = debounce(() => {
    fetchNotes();
  }, 300);

  function handleSearchInput(e: Event): void {
    searchQuery = (e.target as HTMLInputElement).value;
    debouncedFetch();
  }

  function handleSearchKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      searchQuery = '';
      fetchNotes();
    }
  }
</script>

<div class="grid-view">
  <header class="grid-view__toolbar">
    <div class="grid-view__search">
      <input
        type="search"
        class="grid-view__search-input"
        placeholder="全文検索..."
        value={searchQuery}
        on:input={handleSearchInput}
        on:keydown={handleSearchKeydown}
        aria-label="ノートを全文検索"
      />
    </div>

    <div class="grid-view__filters">
      <DateFilter
        {fromDate}
        {toDate}
        on:date-change={handleDateChange}
      />
      <TagFilter
        {availableTags}
        {selectedTag}
        on:tag-change={handleTagChange}
      />
    </div>
  </header>

  <main class="grid-view__content">
    {#if loading}
      <div class="grid-view__status" role="status" aria-label="読み込み中">
        <span class="grid-view__spinner" aria-hidden="true"></span>
        <span>読み込み中...</span>
      </div>
    {:else if error !== null}
      <div class="grid-view__status grid-view__status--error" role="alert">
        <p>ノートの読み込みに失敗しました</p>
        <p class="grid-view__error-detail">{error}</p>
        <button class="grid-view__retry" type="button" on:click={fetchNotes}>
          再試行
        </button>
      </div>
    {:else if notes.length === 0}
      <div class="grid-view__status">
        <p>ノートが見つかりません</p>
      </div>
    {:else}
      <div class="grid-view__masonry">
        {#each notes as note (note.filename)}
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

  /* ---- Toolbar ---- */

  .grid-view__toolbar {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--toolbar-bg, #fafafa);
    flex-shrink: 0;
  }

  .grid-view__search {
    width: 100%;
  }

  .grid-view__search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 0.5rem;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #374151);
    box-sizing: border-box;
  }

  .grid-view__search-input:focus {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: -1px;
    border-color: var(--focus-ring, #3b82f6);
  }

  .grid-view__search-input::placeholder {
    color: var(--text-placeholder, #9ca3af);
  }

  .grid-view__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  /* ---- Content / Masonry ---- */

  .grid-view__content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  /* CSS Columns Masonry — stable in WebKitGTK & WKWebView (OQ-003 fallback) */
  .grid-view__masonry {
    column-width: 16rem;
    column-gap: 0.75rem;
  }

  /* ---- Status states ---- */

  .grid-view__status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem 1rem;
    color: var(--text-secondary, #6b7280);
    font-size: 0.875rem;
    text-align: center;
  }

  .grid-view__status--error {
    color: var(--error-text, #dc2626);
  }

  .grid-view__error-detail {
    font-size: 0.75rem;
    color: var(--text-tertiary, #9ca3af);
    max-width: 32rem;
    word-break: break-word;
  }

  .grid-view__spinner {
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--border-color, #d1d5db);
    border-top-color: var(--focus-ring, #3b82f6);
    border-radius: 50%;
    animation: grid-spin 0.6s linear infinite;
  }

  @keyframes grid-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .grid-view__retry {
    margin-top: 0.25rem;
    padding: 0.375rem 1rem;
    font-size: 0.8125rem;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 0.375rem;
    background: var(--chip-bg, #f3f4f6);
    color: var(--text-primary, #374151);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .grid-view__retry:hover {
    background: var(--chip-hover-bg, #e5e7eb);
  }

  .grid-view__retry:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
  }
</style>
