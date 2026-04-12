<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ change: string[] }>();

  let newTagInput = '';

  function removeTag(tag: string) {
    const updated = tags.filter((t) => t !== tag);
    dispatch('change', updated);
  }

  function addTag() {
    const trimmed = newTagInput.trim();
    if (!trimmed || tags.includes(trimmed)) {
      newTagInput = '';
      return;
    }
    dispatch('change', [...tags, trimmed]);
    newTagInput = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }
</script>

<style>
  .frontmatter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 16px;
    background: var(--frontmatter-bg, #f0f4f8);
    border-bottom: 1px solid #e2e8f0;
    min-height: 44px;
  }
  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    background: #e2e8f0;
    border-radius: 12px;
    font-size: 13px;
    color: #2d3748;
  }
  .tag-chip button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #718096;
    font-size: 12px;
    line-height: 1;
  }
  .tag-chip button:hover {
    color: #e53e3e;
  }
  .tag-input {
    border: none;
    background: transparent;
    font-size: 13px;
    outline: none;
    min-width: 80px;
    color: #4a5568;
  }
  .tag-input::placeholder {
    color: #a0aec0;
  }
</style>

<div class="frontmatter-bar" data-testid="frontmatter-bar">
  {#each tags as tag (tag)}
    <span class="tag-chip">
      {tag}
      <button type="button" on:click={() => removeTag(tag)} aria-label="{tag} を削除">×</button>
    </span>
  {/each}
  <input
    class="tag-input"
    type="text"
    placeholder="タグを追加..."
    bind:value={newTagInput}
    on:keydown={handleKeydown}
    on:blur={addTag}
    aria-label="タグ入力"
  />
</div>
