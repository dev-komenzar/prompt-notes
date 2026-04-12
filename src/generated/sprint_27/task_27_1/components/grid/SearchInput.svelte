<script lang="ts">
  import { filtersStore } from '../../stores/filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput() {
    clearTimeout(debounceTimer);
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
    type="search"
    class="search-input"
    placeholder="ノートを検索..."
    bind:value={inputValue}
    on:input={handleInput}
    aria-label="全文検索"
  />
  {#if inputValue}
    <button type="button" class="clear-btn" on:click={handleClear} aria-label="検索をクリア">×</button>
  {/if}
</div>

<style>
  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-input {
    padding: 5px 28px 5px 12px;
    background: #1e293b;
    border: 1px solid #334155;
    color: #e2e8f0;
    border-radius: 6px;
    font-size: 13px;
    outline: none;
    min-width: 200px;
    transition: border-color 0.15s;
  }
  .search-input:focus { border-color: #3b82f6; }
  .search-input::placeholder { color: #475569; }
  /* hide browser built-in clear button */
  .search-input::-webkit-search-cancel-button { display: none; }
  .clear-btn {
    position: absolute;
    right: 6px;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0 2px;
  }
  .clear-btn:hover { color: #94a3b8; }
</style>
