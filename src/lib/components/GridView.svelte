<script lang="ts">
  import { notes, loading, searchQuery, selectedTags, allTags, openNote } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { debounce } from '$lib/debounce';
  import { deleteNote } from '$lib/api';
  import { formatRelativeTime } from '$lib/date-utils';
  import NoteCard from './NoteCard.svelte';
  import FilterBar from './FilterBar.svelte';

  let { dateRange, onDateChange, onRefresh }:
    { dateRange: { from: string; to: string }; onDateChange: (from: string, to: string) => void; onRefresh: () => void }
    = $props();

  let notesList: typeof $notes = $state([]);
  let isLoading = $state(false);
  let query = $state('');

  notes.subscribe(v => notesList = v);
  loading.subscribe(v => isLoading = v);
  searchQuery.subscribe(v => query = v);

  function handleCardClick(filename: string) {
    openNote(filename);
    goto(`/edit/${encodeURIComponent(filename)}`);
  }

  async function handleDelete(filename: string) {
    try {
      await deleteNote(filename);
      onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  function handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    searchQuery.set(target.value);
  }
</script>

<div class="grid-page">
  <FilterBar
    {dateRange}
    {onDateChange}
    bind:searchValue={query}
    onSearchInput={handleSearchInput}
  />

  {#if isLoading}
    <div class="grid-loading">読み込み中...</div>
  {:else if notesList.length === 0}
    <div class="grid-empty">
      <p>ノートがありません</p>
      <p class="hint">Cmd+N で新しいノートを作成</p>
    </div>
  {:else}
    <div class="masonry-grid">
      {#each notesList as note (note.filename)}
        <NoteCard
          {note}
          onClick={() => handleCardClick(note.filename)}
          onDelete={() => handleDelete(note.filename)}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .grid-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .masonry-grid {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    columns: 3 280px;
    column-gap: 16px;
  }

  .grid-loading,
  .grid-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .hint {
    font-size: 12px;
    margin-top: 8px;
    color: var(--color-text-secondary);
  }
</style>
