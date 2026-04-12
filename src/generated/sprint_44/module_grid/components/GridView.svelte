<script lang="ts">
  // @codd-trace: detail:grid_search §4.5
  // RBC-GRID-1: Pinterest スタイル可変高カード + デフォルト7日間フィルタ
  // RBC-GRID-2: タグ・日付フィルタ + 全文検索
  // RBC-GRID-3: カードクリック → エディタ遷移
  // Sprint 44 目標: 初回マウント <100ms, 全文検索 <200ms

  import { onMount } from 'svelte';
  import { filtersStore } from '../stores/filters';
  import { notesStore } from '../stores/notes';
  import { listNotes, searchNotes } from '../ipc';
  import { mark, measure, PERF_MARKS, THRESHOLDS } from '../perf';
  import type { GridFilters, NoteFilter } from '../types';
  import NoteCard from './NoteCard.svelte';
  import FilterBar from './FilterBar.svelte';

  let loading = false;
  let fetchError: string | null = null;
  let isMounted = false;

  async function fetchNotes(filters: GridFilters): Promise<void> {
    if (!isMounted) return;
    loading = true;
    fetchError = null;

    const isSearch = filters.query.length > 0;
    const searchStart = isSearch ? PERF_MARKS.SEARCH_ISSUE : PERF_MARKS.GRID_MOUNT_START;
    mark(searchStart);

    try {
      const filter: NoteFilter = {
        tags: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      const notes = isSearch
        ? await searchNotes(filters.query, filter)
        : await listNotes(filter);
      notesStore.set(notes);
    } catch (e) {
      fetchError = e instanceof Error ? e.message : String(e);
      console.error('[grid] fetchNotes failed', e);
    } finally {
      loading = false;
      if (isSearch) {
        mark(PERF_MARKS.SEARCH_DONE);
        measure('full-text-search', PERF_MARKS.SEARCH_ISSUE, PERF_MARKS.SEARCH_DONE, THRESHOLDS.FULL_TEXT_SEARCH);
      } else {
        mark(PERF_MARKS.GRID_MOUNT_END);
        measure('initial-mount', PERF_MARKS.GRID_MOUNT_START, PERF_MARKS.GRID_MOUNT_END, THRESHOLDS.INITIAL_MOUNT);
      }
    }
  }

  onMount(() => {
    mark(PERF_MARKS.GRID_MOUNT_START);
    isMounted = true;
    fetchNotes($filtersStore);
  });

  // filtersStore の変化ごとに再取得（初回 onMount 後のみ）
  $: if (isMounted) fetchNotes($filtersStore);
</script>

<div class="grid-page">
  <FilterBar />
  {#if loading}
    <div class="state-msg" aria-live="polite" aria-busy="true">読み込み中...</div>
  {:else if fetchError}
    <div class="state-msg error" role="alert">{fetchError}</div>
  {:else if $notesStore.length === 0}
    <div class="state-msg">ノートが見つかりません</div>
  {:else}
    <div class="grid-container" role="list" aria-label="ノート一覧">
      {#each $notesStore as note (note.id)}
        <div role="listitem">
          <NoteCard {note} />
        </div>
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
    background: var(--page-bg, #f3f4f6);
  }

  /* Pinterest スタイル可変高 Masonry — CSS columns で JS ライブラリ不要 */
  .grid-container {
    columns: 3 280px;
    column-gap: 16px;
    padding: 16px;
    overflow-y: auto;
    flex: 1;
  }

  .grid-container > div {
    break-inside: avoid;
  }

  .state-msg {
    padding: 48px 32px;
    text-align: center;
    color: var(--text-secondary, #6b7280);
    font-size: 14px;
  }

  .state-msg.error {
    color: var(--color-error, #ef4444);
  }
</style>
