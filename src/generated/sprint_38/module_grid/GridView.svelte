<script lang="ts">
  import { filtersStore } from './filters';
  import { notesStore } from './notes';
  import { listNotes, searchNotes } from './ipc';
  import NoteCard from './NoteCard.svelte';
  import FilterBar from './FilterBar.svelte';
  import type { GridFilters } from './filters';
  import type { NoteFilter } from './types';

  let loading = false;
  let fetchError: string | null = null;
  let fetchId = 0;

  async function fetchNotes(filters: GridFilters): Promise<void> {
    const currentId = ++fetchId;
    loading = true;
    fetchError = null;

    try {
      const filter: NoteFilter = {
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      };

      const notes = filters.query.trim()
        ? await searchNotes(filters.query.trim(), filter)
        : await listNotes(filter);

      if (currentId === fetchId) {
        notesStore.set(notes);
      }
    } catch (e) {
      if (currentId === fetchId) {
        fetchError = e instanceof Error ? e.message : 'データの取得に失敗しました';
        notesStore.set([]);
      }
    } finally {
      if (currentId === fetchId) {
        loading = false;
      }
    }
  }

  $: fetchNotes($filtersStore);
</script>

<div class="grid-page">
  <FilterBar />

  <main class="grid-main">
    {#if loading}
      <div class="state-display" role="status" aria-live="polite" aria-label="読み込み中">
        <div class="spinner" aria-hidden="true"></div>
        <span>読み込み中...</span>
      </div>
    {:else if fetchError}
      <div class="state-display error" role="alert">
        <p>データの取得に失敗しました</p>
        <p class="error-detail">{fetchError}</p>
      </div>
    {:else if $notesStore.length === 0}
      <div class="state-display empty" role="status" aria-live="polite">
        <p class="empty-title">ノートが見つかりません</p>
        <p class="empty-hint">フィルター条件を変更するか、新しいノートを作成してください</p>
      </div>
    {:else}
      <div
        class="grid-container"
        role="list"
        aria-label={`ノート一覧 ${$notesStore.length}件`}
      >
        {#each $notesStore as note (note.id)}
          <div role="listitem">
            <NoteCard {note} />
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .grid-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--page-bg, #f3f4f6);
    overflow: hidden;
  }

  .grid-main {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .grid-container {
    columns: 3 280px;
    column-gap: 16px;
    padding: 16px;
  }

  .grid-container > div {
    break-inside: avoid;
  }

  .state-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 48px 24px;
    gap: 8px;
    color: var(--text-muted, #6b7280);
    font-size: 14px;
    text-align: center;
  }

  .state-display.error {
    color: var(--color-error, #dc2626);
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color, #e5e7eb);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-secondary, #374151);
    margin: 0;
  }

  .empty-hint {
    font-size: 13px;
    color: var(--text-muted, #9ca3af);
    margin: 0;
  }

  .error-detail {
    font-size: 12px;
    opacity: 0.8;
    margin: 0;
    max-width: 400px;
  }
</style>
