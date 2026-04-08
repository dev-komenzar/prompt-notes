<!-- Sprint 17/67 – Grid view with masonry layout, search, date and tag filters -->
<!-- OQ-003 resolution: CSS Columns for masonry layout -->
<!-- OQ-GRID-001 resolution: 300ms search debounce -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    notes,
    loading,
    searchQuery,
    selectedTags,
    allTags,
    config,
    addToast,
    openNote,
  } from "../lib/stores";
  import { listNotes, searchNotes, getAllTags } from "../lib/api";
  import { getDefaultDateRange, formatDateParam } from "../lib/date-utils";
  import { debounce } from "../lib/debounce";
  import type { NoteEntry, ListNotesParams } from "../lib/types";
  import NoteCard from "./NoteCard.svelte";
  import TagFilter from "./TagFilter.svelte";
  import DateFilter from "./DateFilter.svelte";

  let dateFrom: string = "";
  let dateTo: string = "";
  let localSearchQuery: string = "";

  // Initialize date range from config
  $: {
    if ($config.default_filter_days > 0 && !dateFrom) {
      const range = getDefaultDateRange($config.default_filter_days);
      dateFrom = range.from;
      dateTo = range.to;
    }
  }

  // Debounced search (300ms per OQ-GRID-001)
  const debouncedSearch = debounce((query: string) => {
    searchQuery.set(query);
    loadNotes();
  }, 300);

  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    localSearchQuery = target.value;
    debouncedSearch(localSearchQuery);
  }

  function handleDateChange(event: CustomEvent<{ from: string; to: string }>) {
    dateFrom = event.detail.from;
    dateTo = event.detail.to;
    loadNotes();
  }

  function handleTagToggle(event: CustomEvent<{ tag: string }>) {
    selectedTags.update((tags) => {
      const tag = event.detail.tag;
      if (tags.includes(tag)) {
        return tags.filter((t) => t !== tag);
      } else {
        return [...tags, tag];
      }
    });
    loadNotes();
  }

  function handleClearTags() {
    selectedTags.set([]);
    loadNotes();
  }

  async function loadNotes() {
    loading.set(true);
    try {
      const query = localSearchQuery.trim();
      let result: NoteEntry[];

      if (query) {
        result = await searchNotes({
          query,
          from: dateFrom || undefined,
          to: dateTo || undefined,
          tags: $selectedTags.length > 0 ? $selectedTags : undefined,
        });
      } else {
        const params: ListNotesParams = {
          from: dateFrom || undefined,
          to: dateTo || undefined,
          tags: $selectedTags.length > 0 ? $selectedTags : undefined,
          sort_by: "created",
          sort_order: "desc",
        };
        result = await listNotes(params);
      }
      notes.set(result);
    } catch (e) {
      addToast("error", `Failed to load notes: ${e}`);
    } finally {
      loading.set(false);
    }
  }

  async function loadTags() {
    try {
      const tags = await getAllTags();
      allTags.set(tags);
    } catch (e) {
      // Non-critical, don't show toast
      console.warn("Failed to load tags:", e);
    }
  }

  function handleNoteClick(event: CustomEvent<{ filename: string }>) {
    openNote(event.detail.filename);
  }

  onMount(() => {
    loadTags();
    loadNotes();
  });

  onDestroy(() => {
    debouncedSearch.cancel();
  });
</script>

<div class="grid-view">
  <div class="grid-controls">
    <div class="search-bar">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        class="search-input"
        placeholder="Search notes..."
        value={localSearchQuery}
        on:input={handleSearchInput}
      />
      {#if localSearchQuery}
        <button
          class="clear-search"
          on:click={() => { localSearchQuery = ""; debouncedSearch(""); }}
          title="Clear search"
        >
          ×
        </button>
      {/if}
    </div>
    <DateFilter from={dateFrom} to={dateTo} on:change={handleDateChange} />
    {#if $allTags.length > 0}
      <TagFilter
        tags={$allTags}
        selected={$selectedTags}
        on:toggle={handleTagToggle}
        on:clear={handleClearTags}
      />
    {/if}
  </div>

  <div class="grid-content">
    {#if $loading}
      <div class="loading-state">
        <span>Loading notes...</span>
      </div>
    {:else if $notes.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p>No notes found</p>
        <p class="empty-hint">
          {#if localSearchQuery}
            Try adjusting your search or filters
          {:else}
            Create your first note with the + New button
          {/if}
        </p>
      </div>
    {:else}
      <!-- OQ-003: CSS Columns masonry layout -->
      <div class="masonry-grid">
        {#each $notes as note (note.filename)}
          <NoteCard {note} on:click={handleNoteClick} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .grid-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .grid-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    align-items: center;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 200px;
    max-width: 400px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0 10px;
    transition: border-color 0.15s ease;
  }

  .search-bar:focus-within {
    border-color: var(--accent-color);
  }

  .search-icon {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    padding: 8px 0;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .clear-search {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 18px;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
  }

  .clear-search:hover {
    color: var(--text-primary);
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--text-muted);
  }

  .empty-hint {
    font-size: 13px;
  }

  /* OQ-003: CSS Columns masonry layout */
  .masonry-grid {
    column-count: 3;
    column-gap: 16px;
  }

  @media (max-width: 900px) {
    .masonry-grid {
      column-count: 2;
    }
  }

  @media (max-width: 500px) {
    .masonry-grid {
      column-count: 1;
    }
  }
</style>
