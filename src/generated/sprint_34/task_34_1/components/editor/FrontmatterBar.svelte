<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ change: string[] }>();

  let newTag = '';

  function addTag() {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      dispatch('change', [...tags, trimmed]);
    }
    newTag = '';
  }

  function removeTag(tag: string) {
    dispatch('change', tags.filter((t) => t !== tag));
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }
</script>

<div class="frontmatter-bar">
  <span class="label">tags:</span>
  <div class="tags">
    {#each tags as tag (tag)}
      <span class="tag">
        {tag}
        <button
          class="remove-tag"
          on:click={() => removeTag(tag)}
          aria-label="{tag}を削除"
        >×</button>
      </span>
    {/each}
    <input
      class="tag-input"
      type="text"
      placeholder="タグを追加..."
      bind:value={newTag}
      on:keydown={handleKeydown}
      on:blur={addTag}
    />
  </div>
</div>

<style>
  .frontmatter-bar {
    background: var(--frontmatter-bg, #f0f4f8);
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #e2e8f0;
    min-height: 40px;
    flex-shrink: 0;
  }

  .label {
    font-size: 12px;
    color: #64748b;
    font-family: monospace;
    white-space: nowrap;
    user-select: none;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: #dbeafe;
    color: #1e40af;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  .remove-tag {
    background: none;
    border: none;
    cursor: pointer;
    color: #1e40af;
    padding: 0;
    line-height: 1;
    font-size: 14px;
    display: flex;
    align-items: center;
  }

  .remove-tag:hover {
    color: #1e3a8a;
  }

  .tag-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 12px;
    min-width: 80px;
    color: #374151;
  }
</style>
