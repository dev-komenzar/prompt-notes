<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];
  export let selectedTag: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    'tag-change': { tag: string | undefined };
  }>();

  function handleSelect(tag: string): void {
    if (selectedTag === tag) {
      selectedTag = undefined;
    } else {
      selectedTag = tag;
    }
    dispatch('tag-change', { tag: selectedTag });
  }

  function handleClear(): void {
    selectedTag = undefined;
    dispatch('tag-change', { tag: undefined });
  }
</script>

{#if tags.length > 0}
  <div class="tag-filter">
    <span class="filter-label">タグ:</span>
    <div class="tag-list">
      {#each tags as tag}
        <button
          class="tag-chip"
          class:active={selectedTag === tag}
          on:click={() => handleSelect(tag)}
        >
          {tag}
        </button>
      {/each}
      {#if selectedTag !== undefined}
        <button class="clear-btn" on:click={handleClear}>✕</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tag-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .filter-label {
    font-size: 13px;
    color: var(--text-secondary, #6b7280);
    flex-shrink: 0;
  }
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }
  .tag-chip {
    padding: 3px 10px;
    font-size: 12px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 9999px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    color: var(--text-color, #374151);
    transition: all 0.12s ease;
  }
  .tag-chip:hover {
    border-color: var(--primary, #3b82f6);
    color: var(--primary, #3b82f6);
  }
  .tag-chip.active {
    background: var(--primary, #3b82f6);
    color: #ffffff;
    border-color: var(--primary, #3b82f6);
  }
  .clear-btn {
    padding: 2px 6px;
    font-size: 12px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--text-secondary, #9ca3af);
  }
  .clear-btn:hover {
    color: var(--text-color, #374151);
  }
</style>
