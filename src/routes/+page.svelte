<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import TopBar from '$lib/components/TopBar.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import TagFilter from '$lib/components/TagFilter.svelte';
  import MasonryGrid from '$lib/components/MasonryGrid.svelte';
  import { getNotesState, loadNotes, removeNote } from '$lib/stores/notes.svelte';

  const state = getNotesState();

  onMount(() => {
    loadNotes();

    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        goto('/new');
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  async function handleDelete(filename: string) {
    if (confirm(`「${filename}」を削除しますか？`)) {
      await removeNote(filename);
    }
  }
</script>

<TopBar showSettings showNew />
<SearchBar />
<TagFilter />

<main class="grid-container">
  {#if state.loading}
    <div class="loading">読み込み中...</div>
  {:else if state.error}
    <div class="error">エラー: {state.error}</div>
  {:else}
    <MasonryGrid notes={state.notes} onDelete={handleDelete} />
  {/if}
</main>

<style>
  .grid-container {
    flex: 1;
    overflow-y: auto;
  }

  .loading,
  .error {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 48px;
    color: var(--color-text-muted);
  }

  .error {
    color: var(--color-danger);
  }
</style>
