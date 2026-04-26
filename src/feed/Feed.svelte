<script lang="ts">
  import NoteCard from "./NoteCard.svelte";
  import Toolbar from "./Toolbar.svelte";
  import { notes, loadNotes, loadMoreNotes } from "./notes";
  import { searchResults } from "./searchResults";
  import { filters } from "./filters";
  import { focusedIndex } from "./focus";
  import { handleKey, type DispatcherHooks } from "./keyboard-nav/dispatcher";
  import type { NoteMetadata, SearchResultEntry } from "../shell/tauri-commands";

  interface Props {
    editingFilename: string | null;
  }

  let { editingFilename = $bindable() }: Props = $props();

  // Re-fetch notes when filters change
  $effect(() => {
    // Access reactive filter values to trigger dependency tracking
    const _f = $filters;
    if (!$filters.query) {
      loadNotes();
    }
  });

  let displayItems = $derived.by(() => {
    const sr = $searchResults;
    if (sr) {
      return sr.map((entry: SearchResultEntry) => ({
        note: entry.metadata,
        snippet: entry.snippet,
      }));
    }
    return $notes.map((note: NoteMetadata) => ({
      note,
      snippet: undefined,
    }));
  });

  const hooks: DispatcherHooks = {
    getEditingFilename() {
      return editingFilename;
    },
    setEditingFilename(filename: string | null) {
      editingFilename = filename;
    },
    exitEditing(filename: string) {
      editingFilename = null;
    },
  };

  function onKeydown(event: KeyboardEvent) {
    handleKey(event, hooks);
  }

  function handleScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      loadMoreNotes();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<Toolbar />

<div class="feed" data-testid="feed" on:scroll={handleScroll}>
  <div class="feed-column">
    {#each displayItems as item, i (item.note.filename)}
      <NoteCard
        note={item.note}
        snippet={item.snippet}
        focused={$focusedIndex === i}
        editing={editingFilename === item.note.filename}
        onEdit={() => (editingFilename = item.note.filename)}
        onExitEdit={() => (editingFilename = null)}
        index={i}
      />
    {/each}
  </div>

  {#if displayItems.length === 0}
    <div class="empty-state" data-testid="empty-state">
      <p>No notes yet. Press <kbd>Cmd+N</kbd> / <kbd>Ctrl+N</kbd> to create one.</p>
    </div>
  {/if}
</div>

<style>
  .feed {
    flex: 1;
    overflow-y: auto;
    padding: var(--feed-gap);
  }

  .feed-column {
    display: flex;
    flex-direction: column;
    gap: var(--feed-gap);
    max-width: var(--feed-max-width);
    margin: 0 auto;
  }

  .empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--text-secondary);
    font-size: 15px;
  }

  .empty-state kbd {
    padding: 2px 6px;
    background: var(--surface-hover);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 13px;
    font-family: var(--font-mono);
  }
</style>
