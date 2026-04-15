<script lang="ts">
  import { filters } from "$lib/stores/filters";

  let value = "";
  let timer: ReturnType<typeof setTimeout> | null = null;

  function handleInput() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      filters.update((f) => ({ ...f, query: value }));
    }, 300);
  }

  function handleClear() {
    value = "";
    filters.update((f) => ({ ...f, query: "" }));
  }
</script>

<div class="search-bar">
  <input
    type="text"
    placeholder="Search notes..."
    bind:value
    on:input={handleInput}
  />
  {#if value}
    <button class="clear" on:click={handleClear}>✕</button>
  {/if}
</div>

<style>
  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
  }
  input {
    width: 100%;
    padding: 6px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  input::placeholder { color: var(--text-muted); }
  .clear {
    position: absolute;
    right: 8px;
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
