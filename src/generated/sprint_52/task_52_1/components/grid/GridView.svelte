<!-- @generated-from: docs/detailed_design/grid_search_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { listNotes, searchNotes } from '../../lib/ipc';
  import { filtersStore, type GridFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import FilterBar from './FilterBar.svelte';
  import NoteCard from './NoteCard.svelte';
  import { push } from 'svelte-spa-router';

  let loading = false;
  let fetchError = false;
  let prevFetchController: AbortController | null = null;

  async function fetchNotes(filters: GridFilters) {
    loading = true;
    fetchError = false;
    try {
      const filter = {
        tags: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
        date_from: filters.date_from,
        date_to: filters.date_to,
      };
      const notes = filters.query
        ? await searchNotes(filters.query, filter)
        : await listNotes(filter);
      notesStore.set(notes);
    } catch {
      fetchError = true;
    } finally {
      loading = false;
    }
  }

  const unsubscribe = filtersStore.subscribe((filters) => {
    fetchNotes(filters);
  });

  onDestroy(() => {
    unsubscribe();
  });

  function goToEditor() {
    push('/');
  }
</script>

<div class="grid-page">
  <nav class="top-nav">
    <button class="nav-btn" on:click={goToEditor}>← エディタ</button>
    <h1 class="nav-title">ノート一覧</h1>
    <button class="nav-btn" on:click={() => push('/settings')}>設定</button>
  </nav>

  <FilterBar />

  {#if loading}
    <div class="state-msg">読み込み中...</div>
  {:else if fetchError}
    <div class="state-msg error">ノートの読み込みに失敗しました。</div>
  {:else if $notesStore.length === 0}
    <div class="state-msg">ノートが見つかりません</div>
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
    height: 100vh;
    overflow: hidden;
    background: var(--page-bg, #f7fafc);
  }

  .top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--nav-bg, #2d3748);
    color: #fff;
  }

  .nav-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .nav-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s ease;
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .grid-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    columns: 3 280px;
    column-gap: 16px;
  }

  .state-msg {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--muted, #718096);
    padding: 48px;
  }

  .state-msg.error {
    color: #e53e3e;
  }
</style>
