<script lang="ts">
  // @codd-trace: detail:grid_search §4.4
  // 300ms デバウンスで filtersStore.query を更新する。
  // 独自の検索ロジックは持たない — 全走査は Rust バックエンドが担当。
  import { filtersStore } from '../../stores/filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update(f => ({ ...f, query: inputValue }));
    }, 300);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      inputValue = '';
      clearTimeout(debounceTimer);
      filtersStore.update(f => ({ ...f, query: '' }));
    }
  }

  // filtersStore のリセットに追従して input 値をクリア
  $: if ($filtersStore.query === '' && inputValue !== '') {
    inputValue = '';
  }
</script>

<input
  type="search"
  placeholder="ノートを検索..."
  bind:value={inputValue}
  on:input={handleInput}
  on:keydown={handleKeydown}
  class="search-input"
  aria-label="ノートを全文検索"
/>

<style>
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    font-size: 14px;
    background: var(--input-bg, #fff);
    color: var(--text-color, #1a202c);
    outline: none;
    box-sizing: border-box;
  }
  .search-input:focus {
    border-color: var(--focus-color, #4299e1);
    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
  }
</style>
