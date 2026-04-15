<script lang="ts">
  import { onMount } from "svelte";
  import { filters } from "$lib/stores/filters";
  import { notes } from "$lib/stores/notes";
  import { listAllTags } from "$lib/utils/tauri-commands";

  let allTags: string[] = [];
  let selectedTags: string[] = [];
  let open = false;

  $: isDefault = selectedTags.length === 0 && $filters.query === "";

  $: {
    if (isDefault) {
      loadAllTags();
    } else {
      allTags = [...new Set($notes.flatMap((n) => n.tags))].sort();
    }
  }

  async function loadAllTags() {
    try {
      allTags = await listAllTags();
    } catch { /* ignore */ }
  }

  function toggle(tag: string) {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
    filters.update((f) => ({ ...f, tags: selectedTags }));
  }

  function clear() {
    selectedTags = [];
    filters.update((f) => ({ ...f, tags: [] }));
  }

  onMount(loadAllTags);
</script>

<div class="tag-filter">
  <button class="toggle" on:click={() => (open = !open)}>
    Tags{selectedTags.length > 0 ? ` (${selectedTags.length})` : ""}
  </button>
  {#if open}
    <div class="dropdown">
      {#if selectedTags.length > 0}
        <button class="clear-btn" on:click={clear}>Clear</button>
      {/if}
      {#each allTags as tag}
        <label class="tag-option">
          <input type="checkbox" checked={selectedTags.includes(tag)} on:change={() => toggle(tag)} />
          {tag}
        </label>
      {/each}
      {#if allTags.length === 0}
        <span class="empty">No tags</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tag-filter { position: relative; }
  .toggle {
    padding: 6px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
  }
  .dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px;
    min-width: 160px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 200px;
    overflow-y: auto;
  }
  .tag-option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
  }
  .clear-btn {
    font-size: 12px;
    color: var(--accent);
    text-align: left;
    padding: 2px 0;
  }
  .empty { color: var(--text-muted); font-size: 13px; }
</style>
