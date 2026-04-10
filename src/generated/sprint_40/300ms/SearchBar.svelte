<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ search: string }>();

  export let value: string = '';

  let timer: ReturnType<typeof setTimeout> | null = null;

  function handleInput(e: Event) {
    const query = (e.target as HTMLInputElement).value;
    value = query;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      dispatch('search', query);
    }, 300);
  }

  function handleClear() {
    value = '';
    if (timer) clearTimeout(timer);
    dispatch('search', '');
  }
</script>

<div class="search-bar">
  <input
    type="search"
    bind:value
    on:input={handleInput}
    placeholder="ノートを検索..."
    aria-label="全文検索"
    class="search-input"
  />
  {#if value}
    <button class="clear-button" on:click={handleClear} aria-label="検索をクリア">✕</button>
  {/if}
</div>

<style>
  .search-bar {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    background: #fff;
  }

  .search-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .clear-button {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    font-size: 12px;
    padding: 2px 4px;
    line-height: 1;
  }

  .clear-button:hover {
    color: #374151;
  }
</style>
