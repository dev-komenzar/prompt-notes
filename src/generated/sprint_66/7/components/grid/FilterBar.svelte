<!-- @generated-from: docs/detailed_design/grid_search_design.md §4.3 -->
<!-- タグフィルタ（AND条件）・日付範囲フィルタ・フィルタクリアを提供する。
     バックエンドとの直接通信は行わない。全変更は filtersStore 経由。 -->
<script lang="ts">
  import { filtersStore, resetFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap(n => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update(f => ({
      ...f,
      tags: f.tags?.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...(f.tags ?? []), tag],
    }));
  }

  function handleDateFrom(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_from: value || undefined }));
  }

  function handleDateTo(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    filtersStore.update(f => ({ ...f, date_to: value || undefined }));
  }
</script>

<div class="filter-bar">
  <SearchInput />

  {#if allTags.length > 0}
    <div class="tag-chips" role="group" aria-label="タグフィルタ">
      {#each allTags as tag (tag)}
        <button
          type="button"
          class="chip"
          class:active={$filtersStore.tags?.includes(tag)}
          on:click={() => toggleTag(tag)}
          aria-pressed={$filtersStore.tags?.includes(tag) ?? false}
        >
          {tag}
        </button>
      {/each}
    </div>
  {/if}

  <div class="date-range">
    <label class="date-label">
      <span class="label-text">From</span>
      <input
        type="date"
        value={$filtersStore.date_from ?? ''}
        on:input={handleDateFrom}
        aria-label="開始日"
      />
    </label>
    <span class="separator" aria-hidden="true">〜</span>
    <label class="date-label">
      <span class="label-text">To</span>
      <input
        type="date"
        value={$filtersStore.date_to ?? ''}
        on:input={handleDateTo}
        aria-label="終了日"
      />
    </label>
  </div>

  <button type="button" class="clear-btn" on:click={resetFilters}>
    フィルタクリア
  </button>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
    background: var(--filterbar-bg, #f9fafb);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 4px 10px;
    border-radius: 9999px;
    border: 1px solid var(--border-color, #d1d5db);
    background: var(--chip-bg, #ffffff);
    color: var(--text-color, #374151);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .chip.active {
    background: var(--primary-color, #3b82f6);
    border-color: var(--primary-color, #3b82f6);
    color: #ffffff;
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .date-label {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .label-text {
    font-size: 13px;
    color: var(--muted-color, #6b7280);
  }

  .date-range input[type='date'] {
    padding: 4px 8px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 4px;
    font-size: 13px;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #1f2937);
  }

  .separator {
    color: var(--muted-color, #6b7280);
    font-size: 13px;
    user-select: none;
  }

  .clear-btn {
    align-self: flex-start;
    padding: 6px 14px;
    border-radius: 4px;
    border: 1px solid var(--border-color, #d1d5db);
    background: var(--btn-bg, #ffffff);
    color: var(--text-color, #374151);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .clear-btn:hover {
    background: var(--btn-hover-bg, #f3f4f6);
  }
</style>
