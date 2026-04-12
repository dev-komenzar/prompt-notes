<script lang="ts">
  // @generated-from: docs/detailed_design/editor_clipboard_design.md §3.1, §4.6
  // Frontmatter region — background colour distinguishes it from the body editor.
  // Manages the `tags` metadata field only. No title input. (RB-2, CONV-2)

  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ change: string[] }>();

  let inputValue = '';

  function addTag(): void {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      tags = [...tags, tag];
      dispatch('change', tags);
    }
    inputValue = '';
  }

  function removeTag(tag: string): void {
    tags = tags.filter((t) => t !== tag);
    dispatch('change', tags);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }
</script>

<!--
  This bar IS the "frontmatter region" required by AC-EDIT-01 / FC-EDIT-07.
  Its background-color (--frontmatter-bg) provides the mandatory visual distinction.
-->
<div class="frontmatter-bar" aria-label="ノートタグ">
  <span class="label">tags:</span>
  <div class="tag-list" role="group" aria-label="タグ一覧">
    {#each tags as tag}
      <span class="chip">
        {tag}
        <button
          type="button"
          class="chip-remove"
          aria-label="{tag} を削除"
          on:click={() => removeTag(tag)}
        >×</button>
      </span>
    {/each}
    <input
      class="tag-input"
      type="text"
      placeholder={tags.length === 0 ? 'タグを追加...' : ''}
      aria-label="新しいタグ"
      bind:value={inputValue}
      on:keydown={handleKeydown}
      on:blur={addTag}
    />
  </div>
</div>

<style>
  /* --frontmatter-bg provides the visual distinction required by the spec */
  .frontmatter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--frontmatter-bg, #f0f4f8);
    border-bottom: 1px solid var(--border, #e2e8f0);
    min-height: 40px;
    flex-shrink: 0;
  }

  .label {
    font-size: 12px;
    color: #718096;
    white-space: nowrap;
    font-family: ui-monospace, monospace;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    flex: 1;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #e2e8f0;
    color: #2d3748;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  .chip-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: #718096;
    font-size: 13px;
    padding: 0;
    line-height: 1;
  }

  .chip-remove:hover {
    color: #e53e3e;
  }

  .tag-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 12px;
    color: #4a5568;
    min-width: 80px;
    flex: 1;
  }

  .tag-input::placeholder {
    color: #a0aec0;
  }
</style>
