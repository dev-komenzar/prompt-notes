<!-- @traceability: detail:grid_search §2.1, §4.5 (RBC-GRID-1–3), design:system-design §2.7 -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { filtersStore } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import { listNotes, searchNotes } from '../../lib/ipc';
  import type { GridFilters } from '../../stores/filters';
  import type { NoteFilter } from '../../lib/types';
  import FilterBar from './FilterBar.svelte';
  import NoteCard from './NoteCard.svelte';

  const dispatch = createEventDispatcher<{ openNote: string }>();

  let loading = false;
  let error: string | null = null;

  async function fetchNotes(filters: GridFilters) {
    loading = true;
    error = null;
    try {
      const filter: NoteFilter = {
        tags: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      const notes = filters.query
        ? await searchNotes(filters.query, filter)
        : await listNotes(filter);
      notesStore.set(notes);
    } catch (err) {
      error = 'ノートの読み込みに失敗しました。';
      notesStore.set([]);
    } finally {
      loading = false;
    }
  }

  $: fetchNotes($filtersStore);

  function handleCardSelect(event: CustomEvent<string>) {
    dispatch('openNote', event.detail);
  }

  onMount(() => {
    fetchNotes($filtersStore);
  });
</script>

<div class="grid-page">
  <FilterBar />
  {#if loading}
    <div class="status">読み込み中...</div>
  {:else if error}
    <div class="status error">{error}</div>
  {:else if $notesStore.length === 0}
    <div class="status">ノートが見つかりません</div>
  {:else}
    <div class="grid-container">
      {#each $notesStore as note (note.id)}
        <NoteCard {note} on:select={handleCardSelect} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .grid-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  .grid-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    columns: 3 280px;
    column-gap: 16px;
  }
  .status {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--text-muted, #94a3b8);
  }
  .status.error {
    color: #dc2626;
  }
</style>
