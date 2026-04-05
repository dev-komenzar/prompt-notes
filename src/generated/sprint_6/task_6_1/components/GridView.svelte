<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { NoteEntry } from '../lib/types';
  import { listNotes, searchNotes } from '../lib/api';
  import { getDefaultDateRange } from '../lib/dateUtils';
  import { debounce } from '../lib/debounce';
  import NoteCard from './NoteCard.svelte';
  import TagFilter from './TagFilter.svelte';
  import DateFilter from './DateFilter.svelte';

  const dispatch = createEventDispatcher<{
    navigate: { view: 'editor' | 'settings'; filename?: string };
  }>();

  let notes: NoteEntry[] = [];
  let loading = false;
  let error = '';

  const defaultRange = getDefaultDateRange();
  let fromDate: string = defaultRange.from_date;
  let toDate: string = defaultRange.to_date;
  let selectedTag: string | undefined = undefined;
  let searchQuery = '';

  $: availableTags = [...new Set(notes.flatMap((n) => n.tags))].sort();

  const debouncedSearch = debounce(() => {
    void fetchNotes();
  }, 300);

  async function fetchNotes(): Promise<void> {
    loading = true;
    error = '';
    try {
      if (searchQuery.trim()) {
        notes = await searchNotes({
          query: searchQuery.trim(),
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          tag: selectedTag,
        });
      } else {
        notes = await listNotes({
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          tag: selectedTag,
        });
      }
    } catch (err) {
      error = 'ノートの取得に失敗しました';
      notes = [];
      console.error('Failed to fetch notes:', err);
    } finally {
      loading = false;
    }
  }

  function handleTagChange(event: CustomEvent<{ tag: string | undefined }>): void {
    selectedTag = event.detail.tag;
    void fetchNotes();
  }

  function handleDateChange(event: CustomEvent<{ from_date: string; to_date: string }>): void {
    fromDate = event.detail.from_date;
    toDate = event.detail.to_date;
    void fetchNotes();
  }

  function handleSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    debouncedSearch.call();
  }

  function handleCardClick(event: CustomEvent<{ filename: string }>): void {
    dispatch('navigate', { view: 'editor', filename: event.detail.filename });
  }

  function handleSettingsClick(): void {
    dispatch('navigate', { view: 'settings' });
  }

  onMount(() => {
    void fetchNotes();
  });
</script>

<div class="grid-screen">
  <div class="grid-toolbar">
    <div class="toolbar-left">
      <h1 class="app-title">PromptNotes</h1>
    </div>
    <div class="toolbar-right">
      <button
        class="settings-button"
        on:click={handleSettingsClick}
        aria-label="設定"
        title="設定"
      >⚙</button>
    </div>
  </div>

  <div class="filter-bar">
    <div class="search-box">
      <input
        type="text"
        class="search-input"
        placeholder="全文検索..."
        value={searchQuery}
        on:input={handleSearchInput}
        aria-label="ノートを検索"
      />
    </div>
    <DateFilter {fromDate} {toDate} on:date-change={handleDateChange} />
    <TagFilter tags={availableTags} {selectedTag} on:tag-change={handleTagChange} />
  </div>

  <div class="grid-body">
    {#if loading && notes.length === 0}
      <div class="status-message">読み込み中...</div>
    {:else if error}
      <div class="status-message error">{error}</div>
    {:else if notes.length === 0}
      <div class="status-message">ノートが見つかりません</div>
    {:else}
      <div class="masonry-grid">
        {#each notes as note (note.filename)}
          <NoteCard {note} on:card-click={handleCardClick} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .grid-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .grid-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--toolbar-bg, #f9fafb);
  }
  .toolbar-left {
    display: flex;
    align-items: center;
  }
  .app-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-color, #1f2937);
  }
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .settings-button {
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .settings-button:hover {
    background: var(--button-hover-bg, #f3f4f6);
  }
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border-color, #f3f4f6);
  }
  .search-box {
    flex: 1;
    min-width: 180px;
  }
  .search-input {
    width: 100%;
    padding: 7px 12px;
    font-size: 13px;
    border: 1px solid var(--input-border, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    color: var(--text-color, #374151);
    box-sizing: border-box;
  }
  .search-input:focus {
    outline: 2px solid var(--primary, #3b82f6);
    outline-offset: -1px;
    border-color: var(--primary, #3b82f6);
  }
  .grid-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  .masonry-grid {
    column-count: 3;
    column-gap: 12px;
  }
  @media (max-width: 900px) {
    .masonry-grid { column-count: 2; }
  }
  @media (max-width: 560px) {
    .masonry-grid { column-count: 1; }
  }
  .status-message {
    text-align: center;
    padding: 48px 16px;
    font-size: 14px;
    color: var(--text-secondary, #9ca3af);
  }
  .status-message.error {
    color: #b91c1c;
  }
</style>
