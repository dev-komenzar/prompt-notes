<!--
  sprint:41 task:41-1 module:grid
  DateFilter — date-range picker (CONV-GRID-2).
  Dispatches 'date-change' with { from_date, to_date }.
  Does NOT perform IPC calls; purely presentational.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getDefaultDateRange } from './date-utils';

  export let fromDate: string = '';
  export let toDate: string = '';

  const dispatch = createEventDispatcher<{
    'date-change': { from_date: string; to_date: string };
  }>();

  function handleFromChange(e: Event): void {
    fromDate = (e.target as HTMLInputElement).value;
    emitChange();
  }

  function handleToChange(e: Event): void {
    toDate = (e.target as HTMLInputElement).value;
    emitChange();
  }

  function emitChange(): void {
    dispatch('date-change', { from_date: fromDate, to_date: toDate });
  }

  function resetToDefault(): void {
    const defaults = getDefaultDateRange();
    fromDate = defaults.fromDate;
    toDate = defaults.toDate;
    emitChange();
  }
</script>

<div class="date-filter" role="group" aria-label="日付フィルタ">
  <label class="date-filter__field">
    <span class="date-filter__label">From</span>
    <input
      type="date"
      class="date-filter__input"
      value={fromDate}
      on:change={handleFromChange}
    />
  </label>
  <span class="date-filter__sep">–</span>
  <label class="date-filter__field">
    <span class="date-filter__label">To</span>
    <input
      type="date"
      class="date-filter__input"
      value={toDate}
      on:change={handleToChange}
    />
  </label>
  <button
    class="date-filter__reset"
    type="button"
    on:click={resetToDefault}
    aria-label="直近7日間にリセット"
    title="直近7日間"
  >
    7d
  </button>
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .date-filter__field {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .date-filter__label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary, #6b7280);
    user-select: none;
  }

  .date-filter__input {
    padding: 0.25rem 0.5rem;
    font-size: 0.8125rem;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 0.375rem;
    background: var(--input-bg, #ffffff);
    color: var(--text-primary, #374151);
  }

  .date-filter__input:focus {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: -1px;
    border-color: var(--focus-ring, #3b82f6);
  }

  .date-filter__sep {
    color: var(--text-secondary, #6b7280);
    font-size: 0.875rem;
    user-select: none;
  }

  .date-filter__reset {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 0.375rem;
    background: var(--chip-bg, #f3f4f6);
    color: var(--text-secondary, #6b7280);
    cursor: pointer;
    transition: background-color 0.15s ease;
    user-select: none;
  }

  .date-filter__reset:hover {
    background: var(--chip-hover-bg, #e5e7eb);
  }

  .date-filter__reset:focus-visible {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
  }
</style>
