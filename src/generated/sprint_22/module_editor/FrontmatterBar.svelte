<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @sprint: 22 — 自動保存パイプライン実装 -->
<script lang="ts">
  export let tags: string[] = [];
  export let onTagsChange: (tags: string[]) => void;

  let inputValue = '';
  let inputEl: HTMLInputElement;

  function addTag() {
    const trimmed = inputValue.trim();
    if (!trimmed || tags.includes(trimmed)) {
      inputValue = '';
      return;
    }
    const updated = [...tags, trimmed];
    inputValue = '';
    onTagsChange(updated);
  }

  function removeTag(tag: string) {
    onTagsChange(tags.filter(t => t !== tag));
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }
</script>

<div class="frontmatter-bar" role="region" aria-label="タグ入力">
  <span class="label">tags:</span>

  <div class="tag-list">
    {#each tags as tag}
      <span class="tag-chip">
        {tag}
        <button
          class="remove-btn"
          aria-label="{tag} を削除"
          on:click={() => removeTag(tag)}
        >×</button>
      </span>
    {/each}

    <input
      bind:this={inputEl}
      bind:value={inputValue}
      class="tag-input"
      placeholder={tags.length === 0 ? 'タグを追加...' : ''}
      aria-label="新しいタグ"
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
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
    min-height: 40px;
  }

  .label {
    font-size: 12px;
    font-family: monospace;
    color: #718096;
    flex-shrink: 0;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
    align-items: center;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    background: #bee3f8;
    color: #2b6cb0;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .remove-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 14px;
    color: #4a90d9;
    line-height: 1;
    display: flex;
    align-items: center;
  }

  .remove-btn:hover {
    color: #2b6cb0;
  }

  .tag-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 12px;
    color: #2d3748;
    min-width: 80px;
    flex: 1;
  }

  .tag-input::placeholder {
    color: #a0aec0;
  }
</style>
