<script lang="ts">
  import { filtersStore } from '../../stores/filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update(f => ({ ...f, query: inputValue }));
    }, 300);
  }
</script>

<input
  class="search-input"
  type="search"
  placeholder="ノートを検索..."
  bind:value={inputValue}
  on:input={handleInput}
  aria-label="全文検索"
/>

<style>
  .search-input {
    padding: 6px 14px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 20px;
    font-size: 13px;
    min-width: 200px;
    color: var(--text-color, #334155);
    background: var(--input-bg, #ffffff);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .search-input:focus {
    border-color: var(--accent-color, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .search-input::-webkit-search-cancel-button {
    cursor: pointer;
  }
</style>
