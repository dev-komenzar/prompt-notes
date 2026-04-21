<script lang="ts">
  import { debounce } from "$lib/shell/debounce";

  interface Props {
    query: string;
    onSearch: (query: string) => void;
  }

  let { query, onSearch }: Props = $props();

  const debouncedSearch = debounce((q: string) => {
    onSearch(q);
  }, 200);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    debouncedSearch(target.value);
  }
</script>

<div class="search-bar">
  <input
    type="search"
    placeholder="Search notes..."
    value={query}
    oninput={handleInput}
    aria-label="Search notes"
    data-testid="search-input"
  />
</div>

<style>
  .search-bar {
    width: 100%;
  }
  input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 0.9rem;
  }
  input:focus {
    border-color: var(--accent);
    outline: none;
  }
  input::placeholder {
    color: var(--text-secondary);
  }
</style>
