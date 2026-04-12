<script lang="ts">
  import { filtersStore } from '../../stores/filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

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
/>

<style>
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    background: white;
    color: #374151;
    min-width: 200px;
  }

  .search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
</style>
