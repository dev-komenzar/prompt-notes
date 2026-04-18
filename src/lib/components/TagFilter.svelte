<script lang="ts">
  interface Props {
    tags: string[];
    selectedTags: string[];
    onToggle: (tag: string) => void;
  }

  let { tags, selectedTags, onToggle }: Props = $props();
</script>

{#if tags.length > 0}
  <div class="tag-filter" data-testid="tag-filter">
    {#each tags as tag}
      <button
        class="tag-chip"
        class:selected={selectedTags.includes(tag)}
        onclick={() => onToggle(tag)}
        aria-pressed={selectedTags.includes(tag)}
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
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-secondary);
    transition: all 0.15s;
  }
  .tag-chip:hover {
    background: var(--surface-secondary);
  }
  .tag-chip.selected {
    background: var(--tag-bg);
    color: var(--tag-text);
    border-color: var(--tag-text);
  }
</style>
