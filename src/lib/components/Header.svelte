<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  import { createNote } from "$lib/utils/tauri-commands";
  import SearchBar from "./SearchBar.svelte";
  import TagFilter from "./TagFilter.svelte";
  import DateFilter from "./DateFilter.svelte";

  const dispatch = createEventDispatcher();
  let unlisten: (() => void) | null = null;
  let creating = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async function handleNewNote() {
    if (creating) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    creating = true;
    try {
      const meta = await createNote();
      dispatch("newNote", meta);
    } catch (e) {
      console.error("Failed to create note:", e);
    } finally {
      debounceTimer = setTimeout(() => { creating = false; }, 500);
    }
  }

  onMount(async () => {
    unlisten = await listen("new-note", () => handleNewNote());
  });

  onDestroy(() => {
    unlisten?.();
    if (debounceTimer) clearTimeout(debounceTimer);
  });
</script>

<header class="header">
  <div class="header-left">
    <button class="btn-new" on:click={handleNewNote} disabled={creating}>+ New</button>
    <button class="btn-settings" on:click={() => dispatch("openSettings")}>⚙️</button>
  </div>
  <div class="header-center">
    <SearchBar />
  </div>
  <div class="header-right">
    <TagFilter />
    <DateFilter />
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .header-center {
    flex: 1;
  }
  .header-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .btn-new {
    padding: 6px 16px;
    background: var(--accent);
    color: white;
    border-radius: 6px;
    font-weight: 600;
  }
  .btn-new:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-new:disabled { opacity: 0.5; }
  .btn-settings {
    font-size: 18px;
    padding: 4px 8px;
  }
</style>
