<script lang="ts">
  import { flushSync } from "svelte";
  import NoteCard from "$lib/editor/NoteCard.svelte";
  import SearchBar from "./SearchBar.svelte";
  import TagFilter from "./TagFilter.svelte";
  import DateFilter from "./DateFilter.svelte";
  import { notes, loadNotes, loadMoreNotes, searchNotesAction, prependNote } from "$lib/feed/notes";
  import { filters, setQuery, toggleTag, setDateRange, resetFilters } from "$lib/feed/filters";
  import { searchResults } from "$lib/feed/searchResults";
  import { totalCount } from "$lib/feed/totalCount";
  import { focusedIndex } from "$lib/feed/focus";
  import { handleKey as dispatchNavKey } from "$lib/feed/keyboard-nav/dispatcher";
  import { createNote } from "$lib/shell/tauri-commands";
  import { handleCommandError } from "$lib/shell/error-handler";

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
      focusedIndex.set(null);
    }
  }

  function handleEditorExit(filename: string) {
    const i = $notes.findIndex((n) => n.filename === filename);
    flushSync(() => {
      editingFilename = null;
      if (i >= 0) focusedIndex.set(i);
    });
    // Poke the DOM so tauri-driver invalidates its cached `.cm-editor`
    // reference. Without this, `browser.$('.cm-editor').isExisting()` can
    // return true for the detached node even after Svelte unmount.
    document.body.setAttribute("data-nav-cycle", String(performance.now()));
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    void dispatchNavKey(event, {
      getEditingFilename: () => editingFilename,
      setEditingFilename: (filename) => {
        editingFilename = filename;
      },
      exitEditing: handleEditorExit,
    });
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

<svelte:window onkeydown={handleWindowKeydown} />

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
          isFocused={false}
          onClick={() => handleCardClick(result.metadata.filename)}
        />
      {:else}
        <p class="feed-empty">No search results found.</p>
      {/each}
    {:else}
      {#each $notes as note, i (note.filename)}
        <NoteCard
          note={note}
          isEditing={editingFilename === note.filename}
          isFocused={i === $focusedIndex && editingFilename === null}
          onClick={() => handleCardClick(note.filename)}
          onExit={handleEditorExit}
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
