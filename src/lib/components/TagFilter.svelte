<script lang="ts">
  import {
    getNotesState,
    setSelectedTags,
    loadNotes,
    performSearch
  } from '../stores/notes.svelte';

  const state = getNotesState();

  // Collect all unique tags from notes
  let allTags = $derived(() => {
    const tagSet = new Set<string>();
    for (const note of state.notes) {
      for (const tag of note.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  });

  function toggleTag(tag: string) {
    const current = state.selectedTags;
    if (current.includes(tag)) {
      setSelectedTags(current.filter((t) => t !== tag));
    } else {
      setSelectedTags([...current, tag]);
    }
    if (state.searchQuery.trim()) {
      performSearch();
    } else {
      loadNotes();
    }
  }
</script>

{#if allTags().length > 0}
  <div class="tag-filter" data-testid="tag-filter" aria-label="tag filter">
    {#each allTags() as tag}
      <button
        class="tag-chip"
        class:active={state.selectedTags.includes(tag)}
        onclick={() => toggleTag(tag)}
        type="button"
      >
        #{tag}
      </button>
    {/each}
  </div>
{/if}

<style>
  .tag-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 16px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .tag-chip {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    color: var(--color-tag);
    background: rgba(148, 226, 213, 0.1);
    border: 1px solid transparent;
    transition: all var(--transition-fast);
  }

  .tag-chip:hover {
    background: rgba(148, 226, 213, 0.2);
  }

  .tag-chip.active {
    background: rgba(148, 226, 213, 0.3);
    border-color: var(--color-tag);
  }
</style>
