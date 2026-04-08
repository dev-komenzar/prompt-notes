<!-- Sprint 19 – Tag filter chips for grid view -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let tags: string[] = [];
  export let selected: string[] = [];

  const dispatch = createEventDispatcher<{
    toggle: { tag: string };
    clear: void;
  }>();

  function handleToggle(tag: string) {
    dispatch("toggle", { tag });
  }

  function handleClear() {
    dispatch("clear");
  }
</script>

{#if tags.length > 0}
  <div class="tag-filter">
    <span class="filter-label">Tags:</span>
    <div class="tag-chips">
      {#each tags as tag}
        <button
          class="tag-chip"
          class:selected={selected.includes(tag)}
          on:click={() => handleToggle(tag)}
        >
          {tag}
        </button>
      {/each}
      {#if selected.length > 0}
        <button class="clear-tags-btn" on:click={handleClear}>
          Clear
        </button>
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
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag-chip {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tag-chip:hover {
    border-color: var(--accent-color);
    color: var(--text-primary);
  }

  .tag-chip.selected {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: var(--bg-primary);
    font-weight: 600;
  }

  .clear-tags-btn {
    font-size: 11px;
    padding: 3px 8px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    text-decoration: underline;
  }

  .clear-tags-btn:hover {
    color: var(--text-primary);
  }
</style>
