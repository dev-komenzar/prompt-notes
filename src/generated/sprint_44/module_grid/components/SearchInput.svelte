<script lang="ts">
  // @codd-trace: detail:grid_search §4.4
  // RBC-GRID-2: 全文検索必須 — 300ms デバウンス

  import { filtersStore } from '../stores/filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function handleInput(): void {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update(f => ({ ...f, query: inputValue }));
    }, 300);
  }

  function handleClear(): void {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    inputValue = '';
    filtersStore.update(f => ({ ...f, query: '' }));
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
    <button class="clear-btn" on:click={handleClear} aria-label="検索をクリア">✕</button>
  {/if}
</div>

<style>
  .search-wrapper {
    position: relative;
    flex: 1;
    min-width: 200px;
  }

  .search-input {
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid var(--input-border, #d1d5db);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #111827);
    box-sizing: border-box;
  }

  .search-input:focus {
    outline: 2px solid var(--color-focus, #3b82f6);
    outline-offset: 0;
    border-color: var(--color-focus, #3b82f6);
  }

  .clear-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary, #9ca3af);
    font-size: 12px;
    padding: 2px 4px;
    line-height: 1;
  }

  .clear-btn:hover {
    color: var(--text-primary, #374151);
  }
</style>
