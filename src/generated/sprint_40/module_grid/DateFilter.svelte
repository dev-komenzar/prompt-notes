<!-- CoDD Traceability: sprint:40 task:40-1 module:grid detail:grid_search CONV-GRID-2 -->
<!-- Date range filter component. Dispatches date-change to parent. No IPC calls. -->
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

<div class="date-filter" role="group" aria-label="日付フィルタ">
  <label class="date-filter__label">
    <span class="date-filter__label-text">開始日</span>
    <input
      class="date-filter__input"
      type="date"
      value={fromDate}
      max={toDate}
      on:change={handleFromChange}
    />
  </label>

  <span class="date-filter__separator">〜</span>

  <label class="date-filter__label">
    <span class="date-filter__label-text">終了日</span>
    <input
      class="date-filter__input"
      type="date"
      value={toDate}
      min={fromDate}
      on:change={handleToChange}
    />
  </label>
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .date-filter__label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .date-filter__label-text {
    font-size: 0.7rem;
    color: var(--text-secondary, #64748b);
    font-weight: 500;
  }

  .date-filter__input {
    padding: 4px 8px;
    border: 1px solid var(--input-border, #cbd5e1);
    border-radius: 6px;
    font-size: 0.8rem;
    color: var(--text-primary, #1e293b);
    background: var(--input-bg, #ffffff);
    line-height: 1.4;
  }

  .date-filter__input:focus {
    outline: 2px solid var(--focus-ring, #3b82f6);
    outline-offset: 1px;
    border-color: var(--focus-ring, #3b82f6);
  }

  .date-filter__separator {
    font-size: 0.85rem;
    color: var(--text-secondary, #64748b);
    padding-top: 16px;
  }
</style>
