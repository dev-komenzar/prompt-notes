<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let fromDate: string = '';
  export let toDate: string = '';

  const dispatch = createEventDispatcher<{
    'date-change': { from_date: string; to_date: string };
  }>();

  function handleFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    fromDate = target.value;
    emitChange();
  }

  function handleToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    toDate = target.value;
    emitChange();
  }

  function emitChange(): void {
    dispatch('date-change', { from_date: fromDate, to_date: toDate });
  }
</script>

<div class="date-filter">
  <span class="filter-label">期間:</span>
  <input
    type="date"
    class="date-input"
    value={fromDate}
    on:change={handleFromChange}
    aria-label="開始日"
  />
  <span class="separator">〜</span>
  <input
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
    flex-wrap: wrap;
  }
  .filter-label {
    font-size: 13px;
    color: var(--text-secondary, #6b7280);
    flex-shrink: 0;
  }
  .date-input {
    padding: 4px 8px;
    font-size: 13px;
    border: 1px solid var(--input-border, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    color: var(--text-color, #374151);
  }
  .date-input:focus {
    outline: 2px solid var(--primary, #3b82f6);
    outline-offset: -1px;
    border-color: var(--primary, #3b82f6);
  }
  .separator {
    font-size: 13px;
    color: var(--text-secondary, #6b7280);
  }
</style>
