<script lang="ts">
  // @codd-trace: detail:grid_search §4.3
  // RBC-GRID-2: タグ・日付フィルタ必須

  import { filtersStore, resetFilters } from '../stores/filters';
  import { notesStore } from '../stores/notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap(n => n.tags))].sort();

  function toggleTag(tag: string): void {
    filtersStore.update(f => ({
      ...f,
      tags: f.tags?.includes(tag)
        ? (f.tags ?? []).filter(t => t !== tag)
        : [...(f.tags ?? []), tag],
    }));
  }

  function handleDateFrom(e: Event): void {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_from: value }));
  }

  function handleDateTo(e: Event): void {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_to: value }));
  }
</script>

<div class="filter-bar">
  <div class="top-row">
    <SearchInput />
    <button class="reset-btn" on:click={resetFilters} aria-label="フィルターをリセット">
      リセット
    </button>
  </div>
  {#if allTags.length > 0}
    <div class="tag-chips" role="group" aria-label="タグフィルター">
      {#each allTags as tag}
        <button
          class="chip"
          class:active={$filtersStore.tags?.includes(tag)}
          on:click={() => toggleTag(tag)}
          aria-pressed={$filtersStore.tags?.includes(tag) ?? false}
        >
          #{tag}
        </button>
      {/each}
    </div>
  {/if}
  <div class="date-row">
    <label class="date-label">
      <span>開始</span>
      <input
        type="date"
        value={$filtersStore.date_from ?? ''}
        on:change={handleDateFrom}
        aria-label="開始日"
      />
    </label>
    <span class="date-sep" aria-hidden="true">〜</span>
    <label class="date-label">
      <span>終了</span>
      <input
        type="date"
        value={$filtersStore.date_to ?? ''}
        on:change={handleDateTo}
        aria-label="終了日"
      />
    </label>
  </div>
</div>

<style>
  .filter-bar {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--filter-bg, #f9fafb);
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  .top-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .reset-btn {
    padding: 7px 14px;
    border: 1px solid var(--input-border, #d1d5db);
    border-radius: 6px;
    background: var(--btn-bg, #ffffff);
    color: var(--text-secondary, #6b7280);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }

  .reset-btn:hover {
    background: var(--btn-hover, #f3f4f6);
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 4px 10px;
    border-radius: 14px;
    border: 1px solid var(--chip-border, #d1d5db);
    background: var(--chip-bg, #ffffff);
    color: var(--text-secondary, #6b7280);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.1s, color 0.1s, border-color 0.1s;
  }

  .chip.active {
    background: var(--chip-active-bg, #eff6ff);
    color: var(--chip-active-color, #2563eb);
    border-color: var(--chip-active-border, #93c5fd);
    font-weight: 500;
  }

  .chip:hover:not(.active) {
    background: var(--chip-hover, #f3f4f6);
  }

  .date-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .date-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary, #6b7280);
    cursor: default;
  }

  .date-label input[type='date'] {
    padding: 6px 8px;
    border: 1px solid var(--input-border, #d1d5db);
    border-radius: 6px;
    font-size: 13px;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #111827);
  }

  .date-label input[type='date']:focus {
    outline: 2px solid var(--color-focus, #3b82f6);
    outline-offset: 0;
  }

  .date-sep {
    font-size: 13px;
    color: var(--text-secondary, #9ca3af);
    user-select: none;
  }
</style>
