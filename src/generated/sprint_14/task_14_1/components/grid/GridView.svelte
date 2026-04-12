<!-- @generated-from: docs/detailed_design/grid_search_design.md §4.5 -->
<!-- RBC-GRID-1: Pinterest masonry layout + default 7-day filter -->
<!-- RBC-GRID-2: full-text search + tag/date filter via Rust backend -->
<script lang="ts">
  import { filtersStore } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import { listNotes, searchNotes } from '../../lib/ipc';
  import type { GridFilters } from '../../stores/filters';
  import type { NoteMetadata } from '../../lib/types';
  import NoteCard from './NoteCard.svelte';
  import FilterBar from './FilterBar.svelte';

  let loading = false;
  let fetchError: string | null = null;

  async function fetchNotes(filters: GridFilters): Promise<void> {
    loading = true;
    fetchError = null;
    try {
      const filter = {
        tags: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      const notes: NoteMetadata[] = filters.query
        ? await searchNotes(filters.query, filter)
        : await listNotes(filter);
      notesStore.set(notes);
    } catch {
      fetchError = 'ノートの取得に失敗しました。';
    } finally {
      loading = false;
    }
  }

  // Reactive: re-fetch whenever any filter value changes (Svelte batches same-tick updates)
  $: fetchNotes($filtersStore);
</script>

<div class="grid-page">
  <FilterBar />
  {#if fetchError}
    <div class="msg error" role="alert">{fetchError}</div>
  {:else if loading}
    <div class="msg">読み込み中...</div>
  {:else if $notesStore.length === 0}
    <div class="msg">
      {$filtersStore.query ? '検索結果が見つかりません' : 'ノートが見つかりません'}
    </div>
  {:else}
    <div class="grid-container">
      {#each $notesStore as note (note.id)}
        <NoteCard {note} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .grid-page { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
  /* CSS columns = Pinterest masonry, no JS library needed, supported on WebKitGTK + WKWebView */
  .grid-container {
    flex: 1; overflow-y: auto; padding: 16px;
    columns: 3 280px; column-gap: 16px;
  }
  .msg {
    flex: 1; display: flex; align-items: center;
    justify-content: center; font-size: 16px; color: #718096; padding: 40px;
  }
  .msg.error { color: #f56565; }
</style>
