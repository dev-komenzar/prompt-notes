<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { notes, prependNote, removeNote, updateNote } from "$lib/stores/notes";
  import { filters } from "$lib/stores/filters";
  import { searchResults } from "$lib/stores/searchResults";
  import { totalCount } from "$lib/stores/totalCount";
  import { listNotes, searchNotes, saveNote, readNote } from "$lib/utils/tauri-commands";
  import type { NoteMetadata } from "$lib/utils/tauri-commands";
  import NoteCard from "./NoteCard.svelte";

  export let registerEditor: (filename: string, getContent: () => string) => void;
  export let unregisterEditor: () => void;

  let editingFilename: string | null = null;
  let currentOffset = 0;
  const PAGE_SIZE = 100;
  let cardRefs: Record<string, NoteCard> = {};
  let feedEl: HTMLDivElement;

  export function handleNewNote(meta: NoteMetadata) {
    switchEditTo(null).then(() => {
      prependNote(meta);
      editingFilename = meta.filename;
    });
  }

  async function fetchNotes(f: typeof $filters) {
    currentOffset = 0;
    try {
      if (f.query) {
        const result = await searchNotes({
          query: f.query,
          from_date: f.fromDate,
          to_date: f.toDate,
          tags: f.tags,
          limit: PAGE_SIZE,
          offset: 0,
        });
        notes.set(result.entries.map((e) => e.metadata));
        searchResults.set(result.entries);
        totalCount.set(result.total_count);
      } else {
        const result = await listNotes({
          from_date: f.fromDate,
          to_date: f.toDate,
          tags: f.tags,
          limit: PAGE_SIZE,
          offset: 0,
        });
        notes.set(result.notes);
        searchResults.set(null);
        totalCount.set(result.total_count);
      }
    } catch (e) {
      console.error("Failed to fetch notes:", e);
    }
  }

  $: fetchNotes($filters);

  async function loadNextPage() {
    currentOffset += PAGE_SIZE;
    if (currentOffset >= $totalCount) return;
    const f = $filters;
    try {
      if (f.query) {
        const result = await searchNotes({
          query: f.query,
          from_date: f.fromDate,
          to_date: f.toDate,
          tags: f.tags,
          limit: PAGE_SIZE,
          offset: currentOffset,
        });
        notes.update((prev) => [...prev, ...result.entries.map((e) => e.metadata)]);
        searchResults.update((prev) => (prev ? [...prev, ...result.entries] : result.entries));
      } else {
        const result = await listNotes({
          from_date: f.fromDate,
          to_date: f.toDate,
          tags: f.tags,
          limit: PAGE_SIZE,
          offset: currentOffset,
        });
        notes.update((prev) => [...prev, ...result.notes]);
      }
    } catch (e) {
      console.error("Failed to load next page:", e);
    }
  }

  function handleScroll() {
    if (!feedEl) return;
    const { scrollHeight, scrollTop, clientHeight } = feedEl;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadNextPage();
    }
  }

  async function switchEditTo(filename: string | null) {
    if (editingFilename && editingFilename !== filename) {
      const card = cardRefs[editingFilename];
      if (card) {
        await card.triggerSave();
      }
      unregisterEditor();
    }
    editingFilename = filename;
  }

  function handleRequestEdit(filename: string) {
    switchEditTo(filename);
  }

  function handleSaved(e: CustomEvent<NoteMetadata | null>) {
    if (e.detail) {
      updateNote(e.detail);
    }
    unregisterEditor();
    editingFilename = null;
  }

  function handleDeleted(filename: string) {
    removeNote(filename);
    if (editingFilename === filename) {
      unregisterEditor();
      editingFilename = null;
    }
  }

  function handleGlobalClick(e: MouseEvent) {
    if (!editingFilename) return;
    const card = feedEl?.querySelector(`[data-filename="${editingFilename}"]`);
    if (card && !card.contains(e.target as Node)) {
      switchEditTo(null);
    }
  }
</script>

<svelte:window on:mousedown={handleGlobalClick} />

<div class="feed" bind:this={feedEl} on:scroll={handleScroll}>
  {#each $notes as note (note.filename)}
    <NoteCard
      bind:this={cardRefs[note.filename]}
      metadata={note}
      editing={editingFilename === note.filename}
      searchEntry={$searchResults?.find((r) => r.metadata.filename === note.filename) ?? null}
      on:requestEdit={() => handleRequestEdit(note.filename)}
      on:saved={handleSaved}
      on:deleted={() => handleDeleted(note.filename)}
      {registerEditor}
    />
  {/each}
  {#if $notes.length === 0}
    <div class="empty">No notes found. Press Cmd+N / Ctrl+N to create one.</div>
  {/if}
</div>

<style>
  .feed {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .empty {
    text-align: center;
    color: var(--text-muted);
    margin-top: 80px;
    font-size: 15px;
  }
</style>
