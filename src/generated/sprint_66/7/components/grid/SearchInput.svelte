<!-- @generated-from: docs/detailed_design/grid_search_design.md §4.4 -->
<!-- 300ms デバウンス後に filtersStore.query を更新する。
     バックエンドへの過剰な IPC 呼び出しを抑制する。 -->
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
  type="search"
  placeholder="ノートを検索..."
  bind:value={inputValue}
  on:input={handleInput}
  class="search-input"
  aria-label="ノート全文検索"
/>

<style>
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #1f2937);
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(--focus-color, #3b82f6);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
</style>
