<script lang="ts">
  import NoteCard from "./NoteCard.svelte";
  import SearchBar from "./SearchBar.svelte";
  import TagFilter from "./TagFilter.svelte";
  import DateFilter from "./DateFilter.svelte";
  import { notes, loadNotes, loadMoreNotes, searchNotesAction, prependNote } from "$lib/stores/notes";
  import { filters, setQuery, toggleTag, setDateRange, resetFilters } from "$lib/stores/filters";
  import { searchResults } from "$lib/stores/searchResults";
  import { totalCount } from "$lib/stores/totalCount";
  import { createNote } from "$lib/utils/tauri-commands";
  import { handleCommandError } from "$lib/utils/error-handler";

  let editingFilename: string | null = $state(null);

  let allTags: string[] = $derived(
    [...new Set($notes.flatMap((n) => n.tags))].sort()
  );

  let hasMore = $derived($notes.length < $totalCount && !$searchResults);

  export async function createNewNote(): Promise<void> {
    try {
      const meta = await createNote([]);
      prependNote(meta);
      editingFilename = meta.filename;
    } catch (error) {
      handleCommandError(error);
    }
  }

  function handleCardClick(filename: string) {
    editingFilename = filename;
  }

  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (!target.closest('[data-testid="note-card"]')) {
      editingFilename = null;
    }
  }

  function handleOutsideKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && editingFilename !== null) {
      editingFilename = null;
    }
  }

  async function handleSearch(query: string) {
    setQuery(query);
    await searchNotesAction(query);
  }

  async function handleTagToggle(tag: string) {
    toggleTag(tag);
    await loadNotes();
  }

  async function handleDateChange(from: string | null, to: string | null) {
    setDateRange(from, to);
    await loadNotes();
  }

  async function handleReset() {
    resetFilters();
    await loadNotes();
  }
</script>

<svelte:window onkeydown={handleOutsideKeydown} />

<div
  class="feed-container"
  onclick={handleOutsideClick}
  role="presentation"
  data-testid="feed-screen"
>
  <div class="feed-toolbar">
    <SearchBar onSearch={handleSearch} query={$filters.query} />
    <div class="feed-filters">
      <TagFilter
        tags={allTags}
        selectedTags={$filters.tags}
        onToggle={handleTagToggle}
      />
      <DateFilter
        fromDate={$filters.fromDate}
        toDate={$filters.toDate}
        onChange={handleDateChange}
      />
      <button class="reset-btn" onclick={handleReset}>Reset</button>
    </div>
  </div>

  <div class="feed-list">
    {#if $searchResults}
      {#each $searchResults as result (result.metadata.filename)}
        <NoteCard
          note={result.metadata}
          matchedLine={result.matched_line}
          isEditing={editingFilename === result.metadata.filename}
          onClick={() => handleCardClick(result.metadata.filename)}
        />
      {:else}
        <p class="feed-empty">No search results found.</p>
      {/each}
    {:else}
      {#each $notes as note (note.filename)}
        <NoteCard
          note={note}
          isEditing={editingFilename === note.filename}
          onClick={() => handleCardClick(note.filename)}
        />
      {:else}
        <p class="feed-empty">No notes yet. Create one!</p>
      {/each}
      {#if hasMore}
        <button class="load-more-btn" onclick={loadMoreNotes}>
          Load more
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .feed-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .feed-toolbar {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
  }
  .feed-filters {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .feed-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px;
  }
  .feed-empty {
    text-align: center;
    color: var(--text-secondary);
    padding: 40px 0;
  }
  .reset-btn {
    padding: 4px 10px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    color: var(--text-secondary);
    border: 1px solid var(--border);
  }
  .reset-btn:hover {
    background: var(--surface-secondary);
  }
  .load-more-btn {
    display: block;
    width: 100%;
    padding: 10px;
    margin: 8px 0;
    text-align: center;
    border-radius: var(--radius);
    color: var(--accent);
    border: 1px solid var(--border);
  }
  .load-more-btn:hover {
    background: var(--surface-secondary);
  }
</style>
