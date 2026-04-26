<script lang="ts">
  import { toggleTag } from "./filters";

  interface Props {
    tags: string[];
    selectedTags: string[];
  }

  let { tags, selectedTags }: Props = $props();
</script>

{#if tags.length > 0}
  <div class="tag-filter" data-testid="tag-filter">
    {#each tags as tag (tag)}
      <button
        class="tag-chip"
        class:active={selectedTags.includes(tag)}
        data-testid="tag-chip"
        on:click={() => toggleTag(tag)}
      >
        {tag}
      </button>
    {/each}
  </div>
{/if}

<style>
  .tag-filter {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tag-chip {
    font-size: 12px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .tag-chip:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .tag-chip.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }
</style>
