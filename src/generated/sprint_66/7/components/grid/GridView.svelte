<!-- @generated-from: docs/detailed_design/grid_search_design.md §4.5 -->
<!-- Pinterest スタイル可変高 Masonry レイアウト (RBC-GRID-1)。
     filtersStore 購読によりフィルタ変更を自動検知して再取得する。
     デフォルト直近7日間は filtersStore の初期値で保証 (RBC-GRID-1)。
     全文検索は Rust バックエンドのファイル全走査で実行 (RBC-GRID-2)。
     IPC は ipc.ts ラッパー経由のみ。直接 invoke 呼び出し禁止。 -->
<script lang="ts">
  import { onDestroy } from 'svelte';
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
      fetchError = e instanceof Error ? e.message : 'ノートの読み込みに失敗しました';
      notesStore.set([]);
    } finally {
      loading = false;
    }
  }

  // filtersStore のいずれかのプロパティが変更されるたびに自動再取得
  // Svelte のリアクティブシステムが同一ティック内の複数更新をバッチ処理する
  $: fetchNotes($filtersStore);

  onDestroy(() => {
    notesStore.set([]);
  });
</script>

<div class="grid-page">
  <FilterBar />

  <div class="grid-content">
    {#if loading}
      <div class="status-message">読み込み中...</div>
    {:else if fetchError}
      <div class="status-message error" role="alert">{fetchError}</div>
    {:else if $notesStore.length === 0}
      <div class="status-message empty">
        {$filtersStore.query
          ? `"${$filtersStore.query}" に一致するノートが見つかりません`
          : '直近7日間のノートがありません'}
      </div>
    {:else}
      <!-- CSS columns による Pinterest スタイル Masonry レイアウト -->
      <!-- WebKitGTK (Linux) および WKWebView (macOS) 両対応 -->
      <div class="grid-container" role="list" aria-label="ノート一覧">
        {#each $notesStore as note (note.id)}
          <div role="listitem">
            <NoteCard {note} />
          </div>
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
    background: var(--page-bg, #f3f4f6);
  }

  .grid-content {
    flex: 1;
    overflow-y: auto;
  }

  /* Pinterest スタイル可変高カードレイアウト (RBC-GRID-1)
     JavaScriptベースのMasonry ライブラリ不使用。ブラウザネイティブ CSS columns。
     break-inside: avoid で列間のカード分断を防止。 */
  .grid-container {
    columns: 3 280px;
    column-gap: 16px;
    padding: 16px;
  }

  .status-message {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 64px 16px;
    font-size: 14px;
    color: var(--muted-color, #9ca3af);
  }

  .status-message.error {
    color: var(--error-color, #ef4444);
  }
</style>
