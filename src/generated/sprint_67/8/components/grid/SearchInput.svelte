<!-- @traceability: detail:grid_search §4.4 (RBC-GRID-2) -->
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
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #fff);
    color: var(--text, #1e293b);
    outline: none;
    transition: border-color 0.15s;
  }
  .search-input:focus {
    border-color: var(--accent, #4f46e5);
  }
</style>
