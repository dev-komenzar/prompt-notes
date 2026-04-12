<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- Sprint 21 — FrontmatterBar: タグ入力 UI -->
<script lang="ts">
  export let tags: string[];
  export let onTagsChange: (tags: string[]) => void;

  let inputValue = '';

  function removeTag(tag: string) {
    onTagsChange(tags.filter((t) => t !== tag));
  }

  function commitInput() {
    const trimmed = inputValue.trim().replace(/,/g, '').replace(/\s+/g, '-');
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    inputValue = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitInput();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  }
</script>

<div class="frontmatter-bar">
  <span class="label">tags:</span>
  <div class="tags-container">
    {#each tags as tag}
      <span class="tag-chip">
        {tag}
        <button
          class="remove-btn"
          on:click={() => removeTag(tag)}
          aria-label="{tag} を削除"
        >×</button>
      </span>
    {/each}
    <input
      class="tag-input"
      type="text"
      placeholder={tags.length === 0 ? 'タグを追加...' : ''}
      bind:value={inputValue}
      on:keydown={handleKeydown}
      on:blur={commitInput}
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
    min-height: 40px;
  }

  .label {
    font-size: 12px;
    font-family: monospace;
    color: var(--text-secondary, #718096);
    flex-shrink: 0;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    flex: 1;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    background: var(--tag-bg, #bee3f8);
    color: var(--tag-color, #2b6cb0);
    padding: 2px 8px;
    border-radius: 12px;
  }

  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 14px;
    color: inherit;
    line-height: 1;
    opacity: 0.7;
    display: flex;
    align-items: center;
  }

  .remove-btn:hover {
    opacity: 1;
  }

  .tag-input {
    border: none;
    background: transparent;
    font-size: 13px;
    outline: none;
    min-width: 80px;
    color: var(--text-primary, #2d3748);
  }
</style>
