<!--
  sprint:39 task:39-1 module:grid
  CONV-GRID-1: Default 7-day range pre-populated via props from GridView.
  CONV-GRID-2: Date filter is a required feature. Custom range selection supported.
  Date format: YYYY-MM-DD strings passed to Rust backend for chrono::NaiveDate parsing.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let fromDate: string = '';
  export let toDate: string = '';

  const dispatch = createEventDispatcher<{
    'date-change': { from_date: string; to_date: string };
  }>();

  function handleFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('date-change', { from_date: target.value, to_date: toDate });
  }

  function handleToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    dispatch('date-change', { from_date: fromDate, to_date: target.value });
  }
</script>

<div class="date-filter">
  <label class="filter-label" for="date-from">期間</label>
  <input
    id="date-from"
    type="date"
    class="date-input"
    value={fromDate}
    on:change={handleFromChange}
    aria-label="開始日"
  />
  <span class="date-separator">〜</span>
  <input
    id="date-to"
    type="date"
    class="date-input"
    value={toDate}
    on:change={handleToChange}
    aria-label="終了日"
  />
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .filter-label {
    font-size: 13px;
    color: var(--text-muted, #64748b);
    white-space: nowrap;
  }

  .date-input {
    padding: 5px 8px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #1e293b);
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }

  .date-input:focus {
    border-color: var(--focus-color, #3b82f6);
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(59, 130, 246, 0.2));
  }

  .date-separator {
    font-size: 13px;
    color: var(--text-muted, #64748b);
  }
</style>
