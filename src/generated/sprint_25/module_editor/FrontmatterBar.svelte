<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];

  const dispatch = createEventDispatcher<{ tagsChanged: string[] }>();

  let newTagInput = '';
  let inputVisible = false;
  let inputEl: HTMLInputElement;

  function removeTag(tag: string) {
    dispatch('tagsChanged', tags.filter((t) => t !== tag));
  }

  function addTag() {
    const tag = newTagInput.trim();
    if (tag && !tags.includes(tag)) {
      dispatch('tagsChanged', [...tags, tag]);
    }
    newTagInput = '';
    inputVisible = false;
  }

  function handleInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      addTag();
    } else if (e.key === 'Escape') {
      newTagInput = '';
      inputVisible = false;
    }
  }

  function showInput() {
    inputVisible = true;
    // focus after DOM update
    setTimeout(() => inputEl?.focus(), 0);
  }
</script>

<div class="frontmatter-bar">
  <span class="label">tags:</span>
  <div class="chips">
    {#each tags as tag}
      <span class="chip">
        {tag}
        <button
          class="remove-chip"
          on:click={() => removeTag(tag)}
          aria-label="{tag} を削除"
        >×</button>
      </span>
    {/each}

    {#if inputVisible}
      <input
        bind:this={inputEl}
        bind:value={newTagInput}
        class="tag-input"
        placeholder="タグ名"
        autocomplete="off"
        on:keydown={handleInputKeydown}
        on:blur={addTag}
      />
    {:else}
      <button class="add-btn" on:click={showInput} aria-label="タグを追加">+</button>
    {/if}
  </div>
</div>

<style>
  .frontmatter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f0f4f8;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
    min-height: 42px;
    flex-shrink: 0;
  }

  .label {
    font-size: 12px;
    color: #718096;
    font-family: monospace;
    flex-shrink: 0;
  }

  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: #bee3f8;
    color: #2b6cb0;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    line-height: 1.4;
  }

  .remove-chip {
    background: none;
    border: none;
    cursor: pointer;
    color: #4a90d9;
    font-size: 13px;
    padding: 0;
    line-height: 1;
  }

  .remove-chip:hover {
    color: #2b6cb0;
  }

  .add-btn {
    background: #e2e8f0;
    border: none;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #718096;
    line-height: 1;
  }

  .add-btn:hover {
    background: #cbd5e0;
  }

  .tag-input {
    border: 1px solid #bee3f8;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 12px;
    outline: none;
    width: 100px;
    background: #fff;
  }

  .tag-input:focus {
    border-color: #63b3ed;
  }
</style>
