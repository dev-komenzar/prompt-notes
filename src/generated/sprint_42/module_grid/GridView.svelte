<!--
  sprint:42 task:42-1 module:grid
  Main grid view component.
  Pinterest-style masonry layout via CSS Columns (WebKitGTK/WKWebView compatible).
  Default filter: last 7 days (CONV-GRID-1).
  Tag/date filter and full-text search mandatory (CONV-GRID-2).
  Card click navigates to editor (CONV-GRID-3).
  All data fetched via Tauri IPC — no direct FS access.
-->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { listNotes, searchNotes } from './api';
  import { debounce } from './debounce';
  import { getDefaultFromDate, getDefaultToDate } from './date_utils';
  import type { NoteEntry, FilterState } from './types';
  import NoteCard from './NoteCard.svelte';
  import TagFilter from './TagFilter.svelte';
  import DateFilter from './DateFilter.svelte';

  const dispatch = createEventDispatcher<{
    'navigate-editor': { filename: string };
  }>();

  let notes: NoteEntry[] = [];
  let availableTags: string[] = [];
  let loading = false;
  let errorMessage: string | null = null;

  let filters: FilterState = {
    from_date: getDefaultFromDate(),
    to_date: getDefaultToDate(),
    tag: undefined,
    query: '',
  };

  let searchInput = '';

  function extractUniqueTags(entries: NoteEntry[]): string[] {
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
    errorMessage = null;
    try {
      let result: NoteEntry[];
      if (filters.query.trim() !== '') {
        result = await searchNotes({
          query: filters.query,
          from_date: filters.from_date,
          to_date: filters.to_date,
          tag: filters.tag,
        });
      } else {
        result = await listNotes({
          from_date: filters.from_date,
          to_date: filters.to_date,
          tag: filters.tag,
        });
      }
      notes = result;
      if (!filters.tag) {
        availableTags = extractUniqueTags(result);
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : String(err);
      notes = [];
    } finally {
      loading = false;
    }
  }

  const debouncedSearch = debounce((query: string) => {
    filters = { ...filters, query };
    fetchNotes();
  }, 300);

  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    searchInput = target.value;
    debouncedSearch(searchInput);
  }

  function handleSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      searchInput = '';
      debouncedSearch.cancel();
      filters = { ...filters, query: '' };
      fetchNotes();
    }
  }

  function handleTagChange(event: CustomEvent<{ tag: string | undefined }>): void {
    filters = { ...filters, tag: event.detail.tag };
    fetchNotes();
  }

  function handleDateChange(event: CustomEvent<{ from_date: string; to_date: string }>): void {
    filters = {
      ...filters,
      from_date: event.detail.from_date,
      to_date: event.detail.to_date,
    };
    fetchNotes();
  }

  function handleCardClick(event: CustomEvent<{ filename: string }>): void {
    dispatch('navigate-editor', { filename: event.detail.filename });
  }

  onMount(() => {
    fetchNotes();
  });

  onDestroy(() => {
    debouncedSearch.cancel();
  });
</script>

<div class="grid-view">
  <div class="grid-toolbar">
    <div class="search-box">
      <input
        type="text"
        placeholder="全文検索..."
        value={searchInput}
        on:input={handleSearchInput}
        on:keydown={handleSearchKeydown}
        aria-label="全文検索"
      />
    </div>
    <TagFilter
      tags={availableTags}
      selectedTag={filters.tag}
      on:tag-change={handleTagChange}
    />
    <DateFilter
      fromDate={filters.from_date}
      toDate={filters.to_date}
      on:date-change={handleDateChange}
    />
  </div>

  {#if loading}
    <div class="grid-status" role="status" aria-label="読み込み中">
      <span class="grid-status-text">読み込み中...</span>
    </div>
  {:else if errorMessage}
    <div class="grid-status grid-error" role="alert">
      <p class="grid-status-text">エラー: {errorMessage}</p>
      <button class="retry-button" on:click={fetchNotes}>再試行</button>
    </div>
  {:else if notes.length === 0}
    <div class="grid-status" role="status">
      <span class="grid-status-text">ノートが見つかりません</span>
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
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }

  .search-box input {
    width: 220px;
    padding: 7px 12px;
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #1e293b);
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .search-box input::placeholder {
    color: var(--text-muted, #94a3b8);
  }

  .search-box input:focus {
    outline: none;
    border-color: var(--accent-color, #3b82f6);
    box-shadow: 0 0 0 2px var(--accent-ring, rgba(59, 130, 246, 0.2));
  }

  .masonry-grid {
    column-count: 3;
    column-gap: 16px;
    column-fill: auto;
  }

  @media (max-width: 960px) {
    .masonry-grid {
      column-count: 2;
    }
  }

  @media (max-width: 580px) {
    .masonry-grid {
      column-count: 1;
    }
  }

  .grid-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
  }

  .grid-status-text {
    color: var(--text-muted, #94a3b8);
    font-size: 14px;
  }

  .grid-error .grid-status-text {
    color: var(--error-color, #ef4444);
  }

  .retry-button {
    margin-top: 12px;
    padding: 6px 18px;
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 6px;
    background: var(--button-bg, #f8fafc);
    color: var(--text-color, #1e293b);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .retry-button:hover {
    background: var(--button-hover-bg, #e2e8f0);
  }
</style>
