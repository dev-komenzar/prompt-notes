<script lang="ts">
  // @sprint: 30
  // @task: 30-1
  // @module: editor
  // @implements: FrontmatterBar — タグ編集 UI (AC-EDIT-06, RBC-2)
  export let tags: string[] = [];
  export let onChange: (tags: string[]) => void;

  let inputValue = '';
  let inputEl: HTMLInputElement;

  function addTag() {
    const trimmed = inputValue.trim().replace(/,/g, '').replace(/\s+/g, '-');
    if (!trimmed || tags.includes(trimmed)) {
      inputValue = '';
      return;
    }
    onChange([...tags, trimmed]);
    inputValue = '';
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
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

<div class="frontmatter-bar" role="region" aria-label="タグ編集">
  <span class="fm-label">tags:</span>
  <div class="tag-list">
    {#each tags as tag (tag)}
      <span class="tag">
        {tag}
        <button
          class="tag-remove"
          on:click={() => removeTag(tag)}
          aria-label="{tag} を削除"
        >×</button>
      </span>
    {/each}
    <input
      bind:this={inputEl}
      class="tag-input"
      type="text"
      placeholder="タグを追加..."
      bind:value={inputValue}
      on:keydown={handleKeydown}
      on:blur={addTag}
      aria-label="新しいタグ"
    />
  </div>
</div>

<style>
  .frontmatter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 16px;
    background: var(--frontmatter-bg, #f0f4f8);
    border-bottom: 1px solid #e2e8f0;
    min-height: 40px;
  }

  .fm-label {
    font-size: 12px;
    font-family: monospace;
    color: #718096;
    white-space: nowrap;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #bee3f8;
    color: #2b6cb0;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .tag-remove {
    background: none;
    border: none;
    color: #4a90b8;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    display: flex;
    align-items: center;
  }

  .tag-remove:hover {
    color: #e53e3e;
  }

  .tag-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    font-family: monospace;
    color: #2d3748;
    min-width: 120px;
    flex: 1;
  }

  .tag-input::placeholder {
    color: #a0aec0;
  }
</style>
