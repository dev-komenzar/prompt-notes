<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ change: string[] }>();

  let inputValue = '';

  function addTag() {
    const tag = inputValue.trim();
    if (tag && !tags.includes(tag)) {
      const next = [...tags, tag];
      tags = next;
      dispatch('change', next);
    }
    inputValue = '';
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    tags = next;
    dispatch('change', next);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }
</script>

<div class="frontmatter-bar">
  <span class="label">tags:</span>
  <div class="tag-list">
    {#each tags as tag (tag)}
      <span class="tag">
        {tag}
        <button class="remove-tag" on:click={() => removeTag(tag)} aria-label="タグを削除: {tag}">×</button>
      </span>
    {/each}
    <input
      class="tag-input"
      type="text"
      placeholder="タグを追加..."
      bind:value={inputValue}
      on:keydown={handleKeydown}
      on:blur={addTag}
    />
  </div>
</div>

<style>
  .frontmatter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--frontmatter-bg, #f0f4f8);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    flex-wrap: wrap;
    min-height: 44px;
  }

  .label {
    font-size: 12px;
    color: var(--muted, #718096);
    font-family: monospace;
    flex-shrink: 0;
  }

  .tag-list {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--tag-bg, #bee3f8);
    color: var(--tag-color, #2b6cb0);
    border-radius: 12px;
    font-size: 12px;
  }

  .remove-tag {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    color: inherit;
    opacity: 0.7;
    font-size: 14px;
  }

  .remove-tag:hover {
    opacity: 1;
  }

  .tag-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: var(--text, #2d3748);
    min-width: 120px;
  }

  .tag-input::placeholder {
    color: var(--placeholder, #a0aec0);
  }
</style>
