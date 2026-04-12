// @generated-from: docs/detailed_design/grid_search_design.md
// @sprint: 42
```

```svelte
<script lang="ts">
  import { filtersStore } from './filters';

  let inputValue = '';
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput(): void {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filtersStore.update((f) => ({ ...f, query: inputValue }));
    }, 300);
  }
</script>

<input
  type="search"
  placeholder="ノートを検索..."
  bind:value={inputValue}
  on:input={handleInput}
/>
