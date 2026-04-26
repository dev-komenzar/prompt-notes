<script lang="ts">
  interface Props {
    onSearch: (query: string) => void;
  }

  let { onSearch }: Props = $props();
  let query = $state("");

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    query = target.value;
    onSearch(query);
  }

  function handleClear() {
    query = "";
    onSearch("");
  }
</script>

<div class="search-bar">
  <input
    type="text"
    class="search-input"
    data-testid="search-input"
    placeholder="Search notes…"
    value={query}
    on:input={handleInput}
  />
  {#if query}
    <button
      class="search-clear"
      data-testid="search-clear"
      on:click={handleClear}
      title="Clear search"
    >
      ✕
    </button>
  {/if}
</div>

<style>
  .search-bar {
    position: relative;
    width: 100%;
  }

  .search-input {
    width: 100%;
    padding: 6px 32px 6px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 14px;
    background: var(--surface);
    color: var(--text);
  }

  .search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: var(--text-secondary);
    padding: 2px 4px;
  }

  .search-clear:hover {
    color: var(--text);
  }
</style>
