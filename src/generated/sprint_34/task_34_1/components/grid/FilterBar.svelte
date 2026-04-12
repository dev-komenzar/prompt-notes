<script lang="ts">
  import { filtersStore, resetFilters } from '../../stores/filters';
  import { notesStore } from '../../stores/notes';
  import SearchInput from './SearchInput.svelte';

  $: allTags = [...new Set($notesStore.flatMap((n) => n.tags))].sort();

  function toggleTag(tag: string) {
    filtersStore.update((f) => {
      const tags = f.tags ?? [];
      return {
        ...f,
        tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
      };
    });
  }

  function handleDateFromChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_from: value }));
  }

  function handleDateToChange(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    filtersStore.update((f) => ({ ...f, date_to: value }));
  }
</script>

<div class="filter-bar">
  <SearchInput />
  {#if allTags.length > 0}
    <div class="tag-chips">
      {#each allTags as tag}
        <button
          class="chip"
          class:active={($filtersStore.tags ?? []).includes(tag)}
          on:click={() => toggleTag(tag)}
        >
          {tag}
        </button>
      {/each}
    </div>
  {/if}
  <div class="date-range">
    <input
      type="date"
      value={$filtersStore.date_from ?? ''}
      on:change={handleDateFromChange}
      aria-label="開始日"
    />
    <span class="sep">〜</span>
    <input
      type="date"
      value={$filtersStore.date_to ?? ''}
      on:change={handleDateToChange}
      aria-label="終了日"
    />
  </div>
  <button class="clear-btn" on:click={resetFilters}>クリア</button>
</div>

<style>
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
  }

  .tag-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 4px 12px;
    border-radius: 16px;
    border: 1px solid #cbd5e1;
    background: white;
    cursor: pointer;
    font-size: 12px;
    color: #475569;
    transition: all 0.15s ease;
  }

  .chip:hover {
    background: #f1f5f9;
  }

  .chip.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .date-range input[type='date'] {
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 13px;
    outline: none;
    color: #374151;
  }

  .date-range input[type='date']:focus {
    border-color: #3b82f6;
  }

  .sep {
    color: #94a3b8;
    font-size: 13px;
  }

  .clear-btn {
    padding: 4px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 13px;
    color: #64748b;
    transition: background 0.15s ease;
  }

  .clear-btn:hover {
    background: #f1f5f9;
  }
</style>
