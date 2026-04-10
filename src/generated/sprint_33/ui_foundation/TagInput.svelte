<!-- @codd-sprint: 33 task: 33-1 module: editor -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ change: string[] }>();

  let inputValue = '';
  let inputEl: HTMLInputElement;

  function addTag() {
    const trimmed = inputValue.trim();
    if (!trimmed || tags.includes(trimmed)) {
      inputValue = '';
      return;
    }
    const next = [...tags, trimmed];
    inputValue = '';
    dispatch('change', next);
  }

  function removeTag(index: number) {
    const next = tags.filter((_, i) => i !== index);
    dispatch('change', next);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  function focusInput() {
    inputEl?.focus();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="tag-input-container" on:click={focusInput} role="group" aria-label="タグ入力">
  {#each tags as tag, i}
    <span class="tag-chip">
      <span class="tag-label">{tag}</span>
      <button
        type="button"
        class="tag-remove"
        aria-label="{tag} を削除"
        on:click|stopPropagation={() => removeTag(i)}
      >×</button>
    </span>
  {/each}
  <input
    bind:this={inputEl}
    bind:value={inputValue}
    type="text"
    class="tag-text-input"
    placeholder={tags.length === 0 ? 'タグを追加...' : ''}
    aria-label="新しいタグ"
    on:keydown={handleKeydown}
    on:blur={addTag}
  />
</div>

<style>
  .tag-input-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    min-height: 32px;
    cursor: text;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    border-radius: 12px;
    background-color: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    font-size: 12px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .tag-label {
    color: inherit;
  }

  .tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    opacity: 0.6;
    border-radius: 50%;
  }

  .tag-remove:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .tag-text-input {
    flex: 1;
    min-width: 80px;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    padding: 2px 0;
  }
</style>
