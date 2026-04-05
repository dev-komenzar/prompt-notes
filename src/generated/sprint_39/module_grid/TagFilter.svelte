<!--
  sprint:39 task:39-1 module:grid
  CONV-GRID-2: Tag filter is a required feature. Single-tag selection.
  Tags are dynamically collected from list_notes response NoteEntry.tags.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let tags: string[] = [];
  export let selectedTag: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    'tag-change': { tag: string | undefined };
  }>();

  function handleChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    dispatch('tag-change', { tag: value === '' ? undefined : value });
  }
</script>

<div class="tag-filter">
  <label class="filter-label" for="tag-select">タグ</label>
  <select
    id="tag-select"
    class="filter-select"
    value={selectedTag ?? ''}
    on:change={handleChange}
    aria-label="タグフィルタ"
  >
    <option value="">すべて</option>
    {#each tags as tag}
      <option value={tag}>{tag}</option>
    {/each}
  </select>
</div>

<style>
  .tag-filter {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .filter-label {
    font-size: 13px;
    color: var(--text-muted, #64748b);
    white-space: nowrap;
  }

  .filter-select {
    padding: 6px 28px 6px 10px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #1e293b);
    font-size: 13px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    cursor: pointer;
    outline: none;
    min-width: 120px;
  }

  .filter-select:focus {
    border-color: var(--focus-color, #3b82f6);
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(59, 130, 246, 0.2));
  }
</style>
