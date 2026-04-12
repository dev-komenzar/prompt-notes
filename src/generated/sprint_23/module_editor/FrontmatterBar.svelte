<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ tagsChange: string[] }>();

  let inputValue = '';
  let inputEl: HTMLInputElement;

  function addTag(raw: string) {
    const trimmed = raw.trim().replace(/,+$/, '');
    if (trimmed && !tags.includes(trimmed)) {
      tags = [...tags, trimmed];
      dispatch('tagsChange', tags);
    }
    inputValue = '';
  }

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
    dispatch('tagsChange', tags);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  function handleBlur() {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  }

  export function focus() {
    inputEl?.focus();
  }
</script>

<div class="frontmatter-bar" role="region" aria-label="フロントマター — タグ編集">
  <div class="tags-container">
    {#each tags as tag (tag)}
      <span class="tag-chip">
        <span class="tag-label">{tag}</span>
        <button
          class="tag-remove"
          type="button"
          on:click={() => removeTag(tag)}
          aria-label="タグ「{tag}」を削除"
        >
          ×
        </button>
      </span>
    {/each}
    <input
      bind:this={inputEl}
      class="tag-input"
      type="text"
      placeholder={tags.length === 0 ? 'タグを追加 (Enter / カンマで確定)...' : ''}
      bind:value={inputValue}
      on:keydown={handleKeydown}
      on:blur={handleBlur}
      aria-label="新しいタグを入力"
    />
  </div>
</div>

<style>
  .frontmatter-bar {
    background-color: var(--frontmatter-bg, #f0f4f8);
    border-bottom: 1px solid var(--frontmatter-border, #d1d9e0);
    padding: 8px 16px;
    min-height: 40px;
    display: flex;
    align-items: center;
  }

  /* ダークテーマ対応: OS prefers-color-scheme または .dark クラスによる切替 */
  @media (prefers-color-scheme: dark) {
    .frontmatter-bar {
      background-color: var(--frontmatter-bg, #1e293b);
      border-bottom-color: var(--frontmatter-border, #334155);
    }
  }

  :global(.dark) .frontmatter-bar {
    background-color: var(--frontmatter-bg, #1e293b);
    border-bottom-color: var(--frontmatter-border, #334155);
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    width: 100%;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background-color: var(--tag-chip-bg, #dbeafe);
    color: var(--tag-chip-text, #1e40af);
    border-radius: 4px;
    padding: 2px 6px 2px 8px;
    font-size: 12px;
    font-family: monospace;
    user-select: none;
  }

  @media (prefers-color-scheme: dark) {
    .tag-chip {
      background-color: var(--tag-chip-bg, #1e3a5f);
      color: var(--tag-chip-text, #93c5fd);
    }
  }

  :global(.dark) .tag-chip {
    background-color: var(--tag-chip-bg, #1e3a5f);
    color: var(--tag-chip-text, #93c5fd);
  }

  .tag-label {
    line-height: 1.5;
  }

  .tag-remove {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--tag-remove-color, #64748b);
    padding: 0 2px;
    font-size: 14px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    border-radius: 2px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .tag-remove:hover {
    color: var(--tag-remove-hover, #ef4444);
    background-color: rgba(239, 68, 68, 0.1);
  }

  .tag-remove:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
  }

  .tag-input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 13px;
    font-family: monospace;
    color: var(--tag-input-text, #374151);
    min-width: 160px;
    flex: 1;
    padding: 2px 0;
  }

  @media (prefers-color-scheme: dark) {
    .tag-input {
      color: var(--tag-input-text, #e2e8f0);
    }
  }

  :global(.dark) .tag-input {
    color: var(--tag-input-text, #e2e8f0);
  }

  .tag-input::placeholder {
    color: var(--placeholder-color, #9ca3af);
    font-style: italic;
  }
</style>
