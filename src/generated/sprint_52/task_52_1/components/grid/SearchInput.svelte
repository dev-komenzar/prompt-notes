<!-- @generated-from: docs/detailed_design/grid_search_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import { filtersStore } from '../../stores/filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update((f) => ({ ...f, query: inputValue }));
    }, 300);
  }

  function handleClear() {
    inputValue = '';
    if (debounceTimer) clearTimeout(debounceTimer);
    filtersStore.update((f) => ({ ...f, query: '' }));
  }
</script>

<div class="search-wrapper">
  <input
    type="search"
    class="search-input"
    placeholder="ノートを検索..."
    bind:value={inputValue}
    on:input={handleInput}
    aria-label="全文検索"
  />
  {#if inputValue}
    <button class="clear-btn" on:click={handleClear} aria-label="検索をクリア">×</button>
  {/if}
</div>

<style>
  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #fff);
    color: var(--text, #2d3748);
    outline: none;
    transition: border-color 0.15s ease;
  }

  .search-input:focus {
    border-color: var(--accent, #4299e1);
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--muted, #718096);
    padding: 0 4px;
    line-height: 1;
  }

  .clear-btn:hover {
    color: var(--text, #2d3748);
  }
</style>
