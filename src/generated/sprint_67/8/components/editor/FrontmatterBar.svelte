<!-- @traceability: detail:editor_clipboard §3.1, §3.3, design:system-design §2.6.4 -->
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
  <div class="tags">
    {#each tags as tag}
      <span class="tag">
        {tag}
        <button class="remove" on:click={() => removeTag(tag)} aria-label="タグ削除: {tag}">×</button>
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
    background: var(--frontmatter-bg, #f0f4f8);
    border-bottom: 1px solid var(--border, #e2e8f0);
    padding: 8px 16px;
    min-height: 40px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--tag-bg, #e0e7ff);
    color: var(--tag-color, #3730a3);
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 12px;
  }
  .remove {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    padding: 0;
    font-size: 14px;
    line-height: 1;
  }
  .tag-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    min-width: 100px;
    color: var(--text, #1e293b);
  }
</style>
