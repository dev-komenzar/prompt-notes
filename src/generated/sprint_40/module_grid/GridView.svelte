<!-- CoDD Traceability: sprint:40 task:40-1 module:grid detail:grid_search -->
<!-- CONV-GRID-1: Pinterest masonry + default 7-day filter -->
<!-- CONV-GRID-2: Tag/date filter + full-text search (all via Rust IPC, no client-side filtering) -->
<!-- CONV-GRID-3: Card click dispatches navigate event to App.svelte for editor transition -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { NoteEntry, FilterState } from './types';
  import { listNotes, searchNotes } from './api';
  import { debounce } from './debounce';
  import { getDefaultDateRange } from './date_utils';
  import NoteCard from './NoteCard.svelte';
  import TagFilter from './TagFilter.svelte';
  import DateFilter from './DateFilter.svelte';

  const dispatch = createEventDispatcher<{
    navigate: { view: 'editor'; filename: string };
  }>();

  let notes: NoteEntry[] = [];
  let loading: boolean = true;
  let errorMessage: string = '';

  const defaultRange = getDefaultDateRange();

  let filters: FilterState = {
    fromDate: defaultRange.fromDate,
    toDate: defaultRange.toDate,
    tag: null,
    query: '',
  };

  let searchInput: string = '';

  /** Unique sorted tags derived from current result set for TagFilter display. */
  let availableTags: string[] = [];

  function collectTags(entries: NoteEntry[]): string[] {
    const tagSet = new Set<string>();
    for (const entry of entries) {
      for (const t of entry.tags) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort();
  }

  async function fetchNotes(): Promise<void> {
    loading = true;
    errorMessage = '';

    try {
      let result: NoteEntry[];

      if (filters.query.length > 0) {
        result = await searchNotes({
          query: filters.query,
          from_date: filters.fromDate || undefined,
          to_date: filters.toDate || undefined,
          tag: filters.tag ?? undefined,
        });
      } else {
        result = await listNotes({
          from_date: filters.fromDate || undefined,
          to_date: filters.toDate || undefined,
          tag: filters.tag ?? undefined,
        });
      }

      notes = result;
      availableTags = collectTags(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errorMessage = `ノートの取得に失敗しました: ${message}`;
      notes = [];
    } finally {
      loading = false;
    }
  }

  const debouncedSearch = debounce(() => {
    filters.query = searchInput;
    fetchNotes();
  }, 300);

  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    searchInput = target.value;
    debouncedSearch();
  }

  function handleTagChange(event: CustomEvent<{ tag: string | null }>): void {
    filters.tag = event.detail.tag;
    fetchNotes();
  }

  function handleDateChange(
    event: CustomEvent<{ from_date: string; to_date: string }>
  ): void {
    filters.fromDate = event.detail.from_date;
    filters.toDate = event.detail.to_date;
    fetchNotes();
  }

  function handleCardClick(event: CustomEvent<{ filename: string }>): void {
    dispatch('navigate', { view: 'editor', filename: event.detail.filename });
  }

  onMount(() => {
    fetchNotes();
  });
</script>

<section class="grid-view" aria-label="ノート一覧">
  <header class="grid-view__toolbar">
    <div class="grid-view__search">
      <input
        class="grid-view__search-input"
        type="search"
        placeholder="全文検索…"
        aria-label="全文検索"
        value={searchInput}
        on:input={handleSearchInput}
      />
    </div>

    <div class="grid-view__filters">
      <DateFilter
        fromDate={filters.fromDate}
        toDate={filters.toDate}
        on:date-change={handleDateChange}
      />

      <TagFilter
        {availableTags}
        selectedTag={filters.tag}
        on:tag-change={handleTagChange}
      />
    </div>
  </header>

  {#if loading}
    <div class="grid-view__status" role="status" aria-live="polite">
      <span class="grid-view__spinner" aria-hidden="true"></span>
      読み込み中…
    </div>
  {:else if errorMessage}
    <div class="grid-view__status grid-view__status--error" role="alert">
      {errorMessage}
    </div>
  {:else if notes.length === 0}
    <div class="grid-view__status" role="status">
      ノートが見つかりません。
    </div>
  {:else}
    <div class="grid-view__masonry" role="list">
      {#each notes as entry (entry.filename)}
        <div class="grid-view__card-wrapper" role="listitem">
          <NoteCard {entry} on:card-click={handleCardClick} />
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .grid-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    height: 100%;
    overflow-y: auto;
  }

  .grid-view__toolbar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-shrink: 0;
  }

  .grid-view__search {
    width: 100%;
  }

  .grid-view__search-input {
    width: 100%;
    padding: 8px 12px;
    font-size: 0.875rem;
    border: 1px solid var(--input-border, #cbd5e1);
    border-radius: 8px;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #1e293b);
    box-sizing: border-box;
  }

  .grid-view__search-input:focus {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
    border-color: var(--focus-ring, #3b82f6);
  }

  .grid-view__search-input::placeholder {
    color: var(--text-secondary, #94a3b8);
  }

  .grid-view__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }

  /* Pinterest-style masonry via CSS Columns (CONV-GRID-1).
     CSS Columns are stable on WebKitGTK (Linux) and WKWebView (macOS). */
  .grid-view__masonry {
    column-width: 260px;
    column-gap: 12px;
    column-fill: balance;
  }

  .grid-view__card-wrapper {
    break-inside: avoid;
    display: inline-block;
    width: 100%;
  }

  .grid-view__status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 16px;
    font-size: 0.875rem;
    color: var(--text-secondary, #64748b);
  }

  .grid-view__status--error {
    color: var(--error-color, #dc2626);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .grid-view__spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid var(--spinner-track, #e2e8f0);
    border-top-color: var(--spinner-active, #3b82f6);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
</style>
