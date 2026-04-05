<!--
  sprint:38 task:38-1 module:grid — Date range filter (CONV-GRID-2)
  Provides from/to date inputs. Default is last 7 days (CONV-GRID-1).
  Dispatches date-change event on input change.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let fromDate: string = '';
  export let toDate: string = '';

  const dispatch = createEventDispatcher<{
    'date-change': { fromDate: string; toDate: string };
  }>();

  function handleFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    dispatch('date-change', { fromDate: value, toDate });
  }

  function handleToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    dispatch('date-change', { fromDate, toDate: value });
  }
</script>

<div class="date-filter" role="group" aria-label="日付フィルタ">
  <label class="date-label">
    <span class="date-label-text">開始</span>
    <input
      type="date"
      value={fromDate}
      on:change={handleFromChange}
      class="date-input"
      aria-label="開始日"
    />
  </label>
  <span class="date-separator" aria-hidden="true">〜</span>
  <label class="date-label">
    <span class="date-label-text">終了</span>
    <input
      type="date"
      value={toDate}
      on:change={handleToChange}
      class="date-input"
      aria-label="終了日"
    />
  </label>
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .date-label {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .date-label-text {
    font-size: 12px;
    color: var(--grid-muted, #718096);
    white-space: nowrap;
  }

  .date-input {
    padding: 6px 8px;
    border: 1px solid var(--grid-border, #e2e8f0);
    border-radius: 6px;
    font-size: 13px;
    background: var(--grid-input-bg, #ffffff);
    color: var(--grid-text, #1a202c);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .date-input:focus {
    border-color: var(--grid-focus, #3b82f6);
    box-shadow: 0 0 0 2px var(--grid-focus-ring, rgba(59, 130, 246, 0.2));
  }

  .date-separator {
    font-size: 14px;
    color: var(--grid-muted, #a0aec0);
    padding: 0 2px;
  }
</style>
