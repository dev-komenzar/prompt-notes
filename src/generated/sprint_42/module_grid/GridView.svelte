// @generated-from: docs/detailed_design/grid_search_design.md
// @sprint: 42
// Sprint 42: query 空/非空による API 分岐
//   - query === '' → listNotes(filter)
//   - query !== '' → searchNotes(query, filter)
```

```svelte
<script lang="ts">
  import type { NoteFilter } from '$lib/types';
  import { listNotes, searchNotes } from '$lib/ipc';
  import { filtersStore } from './filters';
  import { notesStore } from './notes';
  import type { GridFilters } from './filters';
  import FilterBar from './FilterBar.svelte';
  import NoteCard from './NoteCard.svelte';

  let loading = false;
  let fetchError = false;

  async function fetchNotes(filters: GridFilters): Promise<void> {
    loading = true;
    fetchError = false;
    try {
      const filter: NoteFilter = {
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      };
      // Sprint 42: core branching — empty query uses listNotes, non-empty uses searchNotes
      const notes = filters.query
        ? await searchNotes(filters.query, filter)
        : await listNotes(filter);
      notesStore.set(notes);
    } catch {
      fetchError = true;
      notesStore.set([]);
    } finally {
      loading = false;
    }
  }

  // Reactive: re-fetch whenever any filter value changes (Svelte batches same-tick updates)
  $: fetchNotes($filtersStore);
</script>

<div class="grid-page">
  <FilterBar />
  {#if loading}
    <div class="status-message">読み込み中...</div>
  {:else if fetchError}
    <div class="status-message error">読み込みに失敗しました</div>
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

<style>
  .grid-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .grid-container {
    columns: 3 280px;
    column-gap: 16px;
    padding: 16px;
    overflow-y: auto;
    flex: 1;
  }
  .status-message {
    padding: 32px;
    text-align: center;
    color: var(--muted-color, #718096);
    font-size: 14px;
  }
  .status-message.error {
    color: var(--error-color, #e53e3e);
  }
</style>
