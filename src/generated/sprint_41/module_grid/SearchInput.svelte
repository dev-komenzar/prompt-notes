<script lang="ts">
  // @generated-from: docs/detailed_design/grid_search_design.md
  // sprint: 41 | task: 41-1 | module: grid
  import { filtersStore } from '../../../stores/filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function handleInput() {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      filtersStore.update(f => ({ ...f, query: inputValue }));
      debounceTimer = undefined;
    }, 300);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      inputValue = '';
      if (debounceTimer !== undefined) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
      }
      filtersStore.update(f => ({ ...f, query: '' }));
    }
  }
</script>

<input
  type="search"
  class="search-input"
  placeholder="ノートを検索..."
  bind:value={inputValue}
  on:input={handleInput}
  on:keydown={handleKeydown}
  aria-label="全文検索"
/>

<style>
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #111827);
    outline: none;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(--focus-color, #6366f1);
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(99, 102, 241, 0.2));
  }

  .search-input::placeholder {
    color: var(--placeholder-color, #9ca3af);
  }
</style>
