<script lang="ts">
  // @generated-from: docs/detailed_design/grid_search_design.md
  // Sprint 40 — FilterBar.svelte: タグチップフィルタ（トグル選択）、日付範囲フィルタ、クリアボタン

  import { filtersStore, resetFilters } from './filters';
  import { notesStore } from './notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap((n) => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  }

  function onDateFromChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_from: value }));
  }

  function onDateToChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_to: value }));
  }
</script>

<div class="filter-bar">
  <SearchInput />

  {#if allTags.length > 0}
    <div class="tag-chips">
      {#each allTags as tag (tag)}
        <button
          class="chip"
          class:active={$filtersStore.tags.includes(tag)}
          on:click={() => toggleTag(tag)}
          type="button"
          aria-pressed={$filtersStore.tags.includes(tag)}
        >
          {tag}
        </button>
      {/each}
    </div>
  {/if}

  <div class="date-range">
    <label class="date-label">
      <span class="sr-only">開始日</span>
      <input
        type="date"
        value={$filtersStore.date_from}
        on:change={onDateFromChange}
        aria-label="開始日"
      />
    </label>
    <span class="date-sep" aria-hidden="true">〜</span>
    <label class="date-label">
      <span class="sr-only">終了日</span>
      <input
        type="date"
        value={$filtersStore.date_to}
        on:change={onDateToChange}
        aria-label="終了日"
      />
    </label>
  </div>

  <button class="clear-btn" on:click={resetFilters} type="button">
    クリア
  </button>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--filter-bar-bg, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 4px 10px;
    border-radius: 16px;
    border: 1px solid var(--chip-border, #cbd5e0);
    background: var(--chip-bg, #fff);
    color: var(--chip-color, #4a5568);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .chip:hover {
    background: var(--chip-hover-bg, #edf2f7);
  }

  .chip.active {
    background: var(--chip-active-bg, #4299e1);
    border-color: var(--chip-active-border, #3182ce);
    color: #fff;
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .date-label {
    display: flex;
    align-items: center;
  }

  .date-range input[type="date"] {
    padding: 4px 8px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    font-size: 13px;
    background: var(--input-bg, #fff);
    color: var(--text-color, #2d3748);
  }

  .date-sep {
    color: var(--muted-color, #718096);
    font-size: 13px;
  }

  .clear-btn {
    padding: 4px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    background: var(--clear-btn-bg, #fff);
    color: var(--muted-color, #718096);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
    margin-left: auto;
  }

  .clear-btn:hover {
    background: var(--clear-btn-hover-bg, #fed7d7);
    color: var(--clear-btn-hover-color, #c53030);
    border-color: var(--clear-btn-hover-border, #fc8181);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
