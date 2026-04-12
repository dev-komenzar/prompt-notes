<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ change: string[] }>();

  let inputValue = '';

  function removeTag(tag: string) {
    dispatch('change', tags.filter(t => t !== tag));
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim().replace(/,+$/, '');
      if (newTag && !tags.includes(newTag)) {
        dispatch('change', [...tags, newTag]);
      }
      inputValue = '';
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      dispatch('change', tags.slice(0, -1));
    }
  }
</script>

<div class="frontmatter-bar">
  <span class="label">tags:</span>
  <div class="tags-container">
    {#each tags as tag (tag)}
      <span class="tag">
        {tag}
        <button
          class="remove-tag"
          on:click={() => removeTag(tag)}
          aria-label={`タグ ${tag} を削除`}
        >×</button>
      </span>
    {/each}
    <input
      class="tag-input"
      bind:value={inputValue}
      on:keydown={handleKeydown}
      placeholder={tags.length === 0 ? 'タグを追加 (Enter で確定)' : ''}
      aria-label="タグを追加"
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
    border-bottom: 1px solid var(--frontmatter-border, #e2e8f0);
    flex-wrap: wrap;
    min-height: 40px;
  }

  .label {
    font-size: 12px;
    color: var(--frontmatter-label, #64748b);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px 2px 8px;
    background: var(--tag-bg, #dbeafe);
    color: var(--tag-color, #1e40af);
    border-radius: 12px;
    font-size: 12px;
    line-height: 1.5;
  }

  .remove-tag {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0 1px;
    font-size: 13px;
    line-height: 1;
    opacity: 0.6;
    border-radius: 50%;
    display: flex;
    align-items: center;
  }

  .remove-tag:hover {
    opacity: 1;
    background: rgba(0, 0, 0, 0.1);
  }

  .tag-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 12px;
    min-width: 120px;
    color: var(--text-color, #1e293b);
    padding: 2px 0;
  }

  .tag-input::placeholder {
    color: var(--muted-color, #94a3b8);
  }
</style>
