<!-- CoDD Trace: plan:implementation_plan > sprint:52 > task:52-1 -->
<!-- Module: components/grid/DateFilter — Date range picker for grid filtering -->
<!-- CONV: 日付フィルタは必須機能。デフォルト直近7日間。未実装ならリリース不可。 -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatDateParam, getDefaultDateRange } from '../../lib/dateUtils';

  export let fromDate: string;
  export let toDate: string;

  const dispatch = createEventDispatcher<{
    'date-change': { fromDate: string; toDate: string };
  }>();

  const presets = [
    { label: '7日間', days: 7 },
    { label: '14日間', days: 14 },
    { label: '30日間', days: 30 },
    { label: '90日間', days: 90 },
  ] as const;

  let activePreset: number | null = 7;

  function applyPreset(days: number): void {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days);
    fromDate = formatDateParam(start);
    toDate = formatDateParam(now);
    activePreset = days;
    dispatch('date-change', { fromDate, toDate });
  }

  function handleFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    fromDate = target.value;
    activePreset = null;
    dispatch('date-change', { fromDate, toDate });
  }

  function handleToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    toDate = target.value;
    activePreset = null;
    dispatch('date-change', { fromDate, toDate });
  }
</script>

<div class="date-filter" role="group" aria-label="日付フィルタ">
  <div class="date-presets">
    {#each presets as preset}
      <button
        class="preset-btn"
        class:active={activePreset === preset.days}
        on:click={() => applyPreset(preset.days)}
        aria-pressed={activePreset === preset.days}
      >
        {preset.label}
      </button>
    {/each}
  </div>
  <div class="date-inputs">
    <label class="date-label">
      <span class="date-label-text">From</span>
      <input
        type="date"
        class="date-input"
        value={fromDate}
        on:change={handleFromChange}
        aria-label="開始日"
      />
    </label>
    <span class="date-separator">–</span>
    <label class="date-label">
      <span class="date-label-text">To</span>
      <input
        type="date"
        class="date-input"
        value={toDate}
        on:change={handleToChange}
        aria-label="終了日"
      />
    </label>
  </div>
</div>

<style>
  .date-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .date-presets {
    display: flex;
    gap: 4px;
  }

  .preset-btn {
    padding: 4px 10px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    background-color: var(--chip-bg, #ffffff);
    color: var(--text-color, #475569);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .preset-btn:hover {
    background-color: var(--hover-bg, #f1f5f9);
  }

  .preset-btn.active {
    background-color: var(--primary-color, #3b82f6);
    color: #ffffff;
    border-color: var(--primary-color, #3b82f6);
  }

  .date-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .date-label {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .date-label-text {
    font-size: 11px;
    color: var(--text-muted, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .date-input {
    padding: 4px 8px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-color, #334155);
    background-color: var(--input-bg, #ffffff);
    outline: none;
  }

  .date-input:focus {
    border-color: var(--primary-color, #3b82f6);
  }

  .date-separator {
    color: var(--text-muted, #94a3b8);
    font-size: 14px;
  }
</style>
