<script lang="ts">
  import { filtersStore } from './filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update((f) => ({ ...f, query: inputValue }));
    }, 300);
  }

  function handleClear() {
    inputValue = '';
    clearTimeout(debounceTimer);
    filtersStore.update((f) => ({ ...f, query: '' }));
  }
</script>

<div class="search-wrapper">
  <input
    type="search"
    placeholder="ノートを検索..."
    bind:value={inputValue}
    on:input={handleInput}
    aria-label="ノート全文検索"
  />
  {#if inputValue}
    <button class="clear-search" on:click={handleClear} aria-label="検索をクリア">×</button>
  {/if}
</div>

<style>
  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  input[type='search'] {
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #111827);
    outline: none;
  }

  input[type='search']:focus {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  input[type='search']::-webkit-search-cancel-button {
    display: none;
  }

  .clear-search {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted, #6b7280);
    font-size: 16px;
    line-height: 1;
    padding: 0;
  }
</style>
