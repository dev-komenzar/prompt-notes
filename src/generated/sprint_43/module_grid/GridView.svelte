<!-- @generated sprint_43/task_43-1 module:grid -->
<!-- GridView: Root component for module:grid. Owns filter/search state, Masonry layout. -->
<!-- CONV-GRID-1: Pinterest-style variable-height cards. Default 7-day filter. -->
<!-- CONV-GRID-2: Tag/date filter and full-text search (file scan via Rust backend). -->
<!-- CONV-GRID-3: Card click dispatches navigate-editor for App.svelte to handle. -->
<!-- CONV-IPC: All data via api.ts wrappers. No direct invoke(). No client-side search. -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { listNotes, searchNotes } from './api';
  import { debounce } from './debounce';
  import { defaultFromDate, defaultToDate } from './date-utils';
  import type { NoteEntry } from './types';
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

  let fromDate: string = defaultFromDate();
  let toDate: string = defaultToDate();
  let selectedTag: string | undefined = undefined;

  let searchInputValue = '';
  let activeSearchQuery = '';

  function extractUniqueTags(entries: NoteEntry[]): string[] {
    const seen = new Set<string>();
    for (let i = 0; i < entries.length; i++) {
      const tags = entries[i].tags;
      for (let j = 0; j < tags.length; j++) {
        seen.add(tags[j]);
      }
    }
    return Array.from(seen).sort();
  }

  async function fetchNotes(): Promise<void> {
    loading = true;
    errorMessage = null;
    try {
      const trimmed = activeSearchQuery.trim();
      const dateFrom = fromDate || undefined;
      const dateTo = toDate || undefined;

      if (trimmed !== '') {
        notes = await searchNotes({
          query: trimmed,
          from_date: dateFrom,
          to_date: dateTo,
          tag: selectedTag,
        });
      } else {
        notes = await listNotes({
          from_date: dateFrom,
          to_date: dateTo,
          tag: selectedTag,
        });
      }

      if (selectedTag === undefined) {
        availableTags = extractUniqueTags(notes);
      }
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : String(err);
      notes = [];
    } finally {
      loading = false;
    }
  }

  const debouncedFetch = debounce(() => {
    fetchNotes();
  }, 300);

  function handleSearchInput(event: Event): void {
    searchInputValue = (event.target as HTMLInputElement).value;
    activeSearchQuery = searchInputValue;
    debouncedFetch();
  }

  function handleSearchClear(): void {
    searchInputValue = '';
    activeSearchQuery = '';
    debouncedFetch.cancel();
    fetchNotes();
  }

  function handleSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      handleSearchClear();
    }
  }

  function handleTagChange(event: CustomEvent<{ tag: string | undefined }>): void {
    selectedTag = event.detail.tag;
    fetchNotes();
  }

  function handleDateChange(
    event: CustomEvent<{ from_date: string; to_date: string }>,
  ): void {
    fromDate = event.detail.from_date;
    toDate = event.detail.to_date;
    selectedTag = undefined;
    fetchNotes();
  }

  function handleCardClick(event: CustomEvent<{ filename: string }>): void {
    dispatch('navigate-editor', { filename: event.detail.filename });
  }

  onMount(() => {
    fetchNotes();
  });

  onDestroy(() => {
    debouncedFetch.cancel();
  });
</script>

<div class="grid-view">
  <header class="grid-view__toolbar">
    <div class="grid-view__search" role="search">
      <svg
        class="grid-view__search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        class="grid-view__search-input"
        placeholder="ノートを検索…"
        value={searchInputValue}
        on:input={handleSearchInput}
        on:keydown={handleSearchKeyDown}
        aria-label="全文検索"
      />
      {#if searchInputValue !== ''}
        <button
          class="grid-view__search-clear"
          on:click={handleSearchClear}
          type="button"
          aria-label="検索をクリア"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      {/if}
    </div>

    <div class="grid-view__filters">
      <DateFilter {fromDate} {toDate} on:date-change={handleDateChange} />
      {#if availableTags.length > 0}
        <TagFilter tags={availableTags} {selectedTag} on:tag-change={handleTagChange} />
      {/if}
    </div>
  </header>

  <main class="grid-view__content">
    {#if loading}
      <div class="grid-view__status" role="status" aria-live="polite">
        <span class="grid-view__spinner" aria-hidden="true"></span>
        読み込み中…
      </div>
    {:else if errorMessage !== null}
      <div class="grid-view__error" role="alert">
        <p>エラーが発生しました: {errorMessage}</p>
      </div>
    {:else if notes.length === 0}
      <div class="grid-view__empty" role="status">
        {#if activeSearchQuery.trim() !== ''}
          <p>「{activeSearchQuery.trim()}」に一致するノートが見つかりません</p>
        {:else}
          <p>ノートがありません</p>
        {/if}
      </div>
    {:else}
      <div class="grid-view__masonry" role="list">
        {#each notes as note (note.filename)}
          <div class="grid-view__item" role="listitem">
            <NoteCard {note} on:card-click={handleCardClick} />
          </div>
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
    padding: 16px;
    gap: 16px;
    overflow: hidden;
  }

  .grid-view__toolbar {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .grid-view__search {
    position: relative;
    display: flex;
    align-items: center;
  }

  .grid-view__search-icon {
    position: absolute;
    left: 12px;
    color: var(--text-muted, #94a3b8);
    pointer-events: none;
  }

  .grid-view__search-input {
    width: 100%;
    padding: 10px 36px 10px 36px;
    font-size: 0.9375rem;
    line-height: 1.4;
    border: 1px solid var(--input-border, #cbd5e1);
    border-radius: 8px;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #1e293b);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .grid-view__search-input::placeholder {
    color: var(--text-muted, #94a3b8);
  }

  .grid-view__search-input:focus {
    outline: none;
    border-color: var(--focus-ring, #3b82f6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  .grid-view__search-clear {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-muted, #94a3b8);
    cursor: pointer;
    transition: color 0.12s ease, background 0.12s ease;
  }

  .grid-view__search-clear:hover {
    color: var(--text-primary, #1e293b);
    background: var(--hover-bg, #f1f5f9);
  }

  .grid-view__search-clear:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
  }

  .grid-view__filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .grid-view__content {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .grid-view__masonry {
    column-count: 3;
    column-gap: 12px;
  }

  .grid-view__item {
    break-inside: avoid;
  }

  @media (max-width: 960px) {
    .grid-view__masonry {
      column-count: 2;
    }
  }

  @media (max-width: 600px) {
    .grid-view__masonry {
      column-count: 1;
    }
  }

  .grid-view__status,
  .grid-view__empty,
  .grid-view__error {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    font-size: 0.9375rem;
    color: var(--text-muted, #94a3b8);
  }

  .grid-view__error {
    color: var(--error-text, #dc2626);
  }

  .grid-view__spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    margin-right: 8px;
    border: 2px solid var(--spinner-track, #e2e8f0);
    border-top-color: var(--spinner-active, #3b82f6);
    border-radius: 50%;
    animation: grid-spin 0.6s linear infinite;
  }

  @keyframes grid-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
