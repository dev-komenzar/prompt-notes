<script lang="ts">
  import { filtersStore } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import { listNotes, searchNotes } from '../../lib/ipc';
  import type { GridFilters } from '../../stores/filters';
  import NoteCard from './NoteCard.svelte';
  import FilterBar from './FilterBar.svelte';

  let loading = false;

  async function fetchNotes(filters: GridFilters) {
    loading = true;
    try {
      const filter = {
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      };
      const result = filters.query
        ? await searchNotes(filters.query, filter)
        : await listNotes(filter);
      notesStore.set(result);
    } catch {
      notesStore.set([]);
    } finally {
      loading = false;
    }
  }

  $: fetchNotes($filtersStore);
</script>

<div class="grid-page">
  <FilterBar />

  <div class="grid-content">
    {#if loading}
      <div class="status-message">読み込み中...</div>
    {:else if $notesStore.length === 0}
      <div class="status-message">ノートが見つかりません</div>
    {:else}
      <div class="grid-container">
        {#each $notesStore as note (note.id)}
          <NoteCard {note} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .grid-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--grid-bg, #f1f5f9);
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
  }

  .grid-container {
    columns: 3 280px;
    column-gap: 16px;
    padding: 16px;
  }

  .status-message {
    padding: 48px;
    text-align: center;
    color: var(--muted-color, #94a3b8);
    font-size: 14px;
  }
</style>
