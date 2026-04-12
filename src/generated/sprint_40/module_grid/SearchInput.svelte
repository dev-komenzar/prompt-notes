<script lang="ts">
  // @generated-from: docs/detailed_design/grid_search_design.md
  // Sprint 40 — SearchInput.svelte: 全文検索入力（300ms デバウンス）

  import { filtersStore } from './filters';

  let inputValue = $filtersStore.query;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleInput() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update((f) => ({ ...f, query: inputValue }));
    }, 300);
  }

  function handleClear() {
    inputValue = '';
    filtersStore.update((f) => ({ ...f, query: '' }));
  }
</script>

<div class="search-wrap">
  <input
    class="search-input"
    type="search"
    placeholder="ノートを検索..."
    bind:value={inputValue}
    on:input={handleInput}
    aria-label="ノートを全文検索"
  />
  {#if inputValue}
    <button class="search-clear" on:click={handleClear} type="button" aria-label="検索をクリア">
      ✕
    </button>
  {/if}
</div>

<style>
  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    padding: 5px 28px 5px 10px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    font-size: 13px;
    background: var(--input-bg, #fff);
    color: var(--text-color, #2d3748);
    width: 200px;
    outline: none;
  }

  .search-input:focus {
    border-color: var(--focus-border, #4299e1);
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(66, 153, 225, 0.3));
  }

  /* Remove browser default clear button */
  .search-input::-webkit-search-cancel-button {
    display: none;
  }

  .search-clear {
    position: absolute;
    right: 6px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--muted-color, #718096);
    font-size: 11px;
    padding: 0;
    line-height: 1;
  }

  .search-clear:hover {
    color: var(--text-color, #2d3748);
  }
</style>
