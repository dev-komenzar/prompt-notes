<script lang="ts">
  // @codd-trace: detail:grid_search §4.5, RBC-GRID-1, RBC-GRID-2, RBC-GRID-3
  // filtersStore の変更を購読して listNotes / searchNotes を自動発行する。
  // query が空なら list_notes、非空なら search_notes を使用 (ファイル全走査)。
  import { filtersStore } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import { listNotes, searchNotes } from '../../lib/ipc';
  import type { GridFilters } from '../../stores/filters';
  import type { NoteFilter } from '../../lib/types';
  import NoteCard from './NoteCard.svelte';
  import FilterBar from './FilterBar.svelte';

  let loading = false;
  let fetchError: string | null = null;

  async function fetchNotes(filters: GridFilters): Promise<void> {
    loading = true;
    fetchError = null;
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
    } catch (e) {
      fetchError =
        e instanceof Error ? e.message : 'データの読み込みに失敗しました';
    } finally {
      loading = false;
    }
  }

  // filtersStore の任意プロパティ変更で自動再取得
  // Svelte のリアクティブシステムが同一ティックの複数更新を 1 回に統合する
  $: fetchNotes($filtersStore);
</script>

<div class="grid-page">
  <FilterBar />

  <div class="grid-body">
    {#if fetchError}
      <div class="state-message error" role="alert">{fetchError}</div>
    {:else if loading}
      <div class="state-message" aria-live="polite" aria-busy="true">
        読み込み中...
      </div>
    {:else if $notesStore.length === 0}
      <div class="state-message" aria-live="polite">
        ノートが見つかりません
      </div>
    {:else}
      <div class="grid-container" aria-label="ノート一覧">
        {#each $notesStore as note (note.id)}
          <NoteCard {note} />
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .grid-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--page-bg, #f7fafc);
  }
  .grid-body {
    flex: 1;
    overflow-y: auto;
  }
  /* Pinterest スタイル可変高カード — CSS columns (RBC-GRID-1 準拠) */
  .grid-container {
    columns: 3 280px;
    column-gap: 16px;
    padding: 16px;
  }
  .state-message {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 64px 16px;
    font-size: 14px;
    color: var(--muted-color, #a0aec0);
  }
  .state-message.error {
    color: var(--error-color, #e53e3e);
  }
</style>
