<script lang="ts">
  import { filtersStore } from '../../stores/filters';
  import { notesStore, selectedNoteId } from '../../stores/notes';
  import { listNotes, searchNotes } from '../../ipc';
  import type { GridFilters } from '../../stores/filters';
  import NoteCard from './NoteCard.svelte';
  import FilterBar from './FilterBar.svelte';

  export let onNavigateToEditor: (noteId: string) => void;

  let loading = false;
  let fetchError = false;

  async function fetchNotes(filters: GridFilters) {
    loading = true;
    fetchError = false;
    try {
      const filter = {
        tags: (filters.tags ?? []).length > 0 ? filters.tags : undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      const notes = filters.query
        ? await searchNotes(filters.query, filter)
        : await listNotes(filter);
      notesStore.set(notes);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      fetchError = true;
    } finally {
      loading = false;
    }
  }

  $: fetchNotes($filtersStore);

  function handleCardClick(noteId: string) {
    selectedNoteId.set(noteId);
    onNavigateToEditor(noteId);
  }
</script>

<div class="grid-page">
  <FilterBar />
  <div class="grid-content">
    {#if loading}
      <div class="status">読み込み中...</div>
    {:else if fetchError}
      <div class="status error">読み込みに失敗しました</div>
    {:else if $notesStore.length === 0}
      <div class="status">ノートが見つかりません</div>
    {:else}
      <div class="grid-container">
        {#each $notesStore as note (note.id)}
          <NoteCard {note} on:click={(e) => handleCardClick(e.detail)} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .grid-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
  }

  .grid-container {
    padding: 16px;
    columns: 3 280px;
    column-gap: 16px;
  }

  .status {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 14px;
    padding: 48px;
  }

  .status.error {
    color: #dc2626;
  }
</style>
