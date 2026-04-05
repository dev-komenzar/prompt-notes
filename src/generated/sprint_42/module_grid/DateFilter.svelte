<!--
  sprint:42 task:42-1 module:grid
  Date range filter UI — sprint 42 primary deliverable.
  CONV-GRID-1: Default filter is last 7 days.
  CONV-GRID-2: Date filter is mandatory.
  Provides preset buttons (7d/30d/90d/all) and custom range inputs.
  Dispatches date-change event with { from_date, to_date } in YYYY-MM-DD format.
  Presentational only — no IPC calls.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    formatDateParam,
    getDefaultFromDate,
    getDefaultToDate,
    getDateRangeForDays,
    getAllTimeDateRange,
    isValidDateString,
  } from './date_utils';
  import type { DatePreset } from './types';

  export let fromDate: string = getDefaultFromDate();
  export let toDate: string = getDefaultToDate();

  const dispatch = createEventDispatcher<{
    'date-change': { from_date: string; to_date: string };
  }>();

  let activePreset: DatePreset = '7days';
  let showCustomRange = false;

  const presets: { key: DatePreset; label: string }[] = [
    { key: '7days', label: '7日間' },
    { key: '30days', label: '30日間' },
    { key: '90days', label: '90日間' },
    { key: 'all', label: '全期間' },
  ];

  function emitDateChange(from: string, to: string): void {
    fromDate = from;
    toDate = to;
    dispatch('date-change', { from_date: from, to_date: to });
  }

  function handlePresetClick(preset: DatePreset): void {
    activePreset = preset;
    showCustomRange = false;
    let range: { from_date: string; to_date: string };

    switch (preset) {
      case '7days':
        range = getDateRangeForDays(7);
        break;
      case '30days':
        range = getDateRangeForDays(30);
        break;
      case '90days':
        range = getDateRangeForDays(90);
        break;
      case 'all':
        range = getAllTimeDateRange();
        break;
      default:
        return;
    }

    emitDateChange(range.from_date, range.to_date);
  }

  function handleToggleCustom(): void {
    showCustomRange = !showCustomRange;
    if (showCustomRange) {
      activePreset = 'custom';
    }
  }

  function handleFromDateInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (!isValidDateString(value)) return;
    activePreset = 'custom';
    emitDateChange(value, toDate);
  }

  function handleToDateInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (!isValidDateString(value)) return;
    activePreset = 'custom';
    emitDateChange(fromDate, value);
  }

  function handleResetToDefault(): void {
    handlePresetClick('7days');
  }

  $: todayMax = formatDateParam(new Date());
</script>

<div class="date-filter" role="group" aria-label="日付フィルタ">
  <div class="date-presets">
    {#each presets as { key, label }}
      <button
        class="preset-button"
        class:active={activePreset === key}
        on:click={() => handlePresetClick(key)}
        aria-pressed={activePreset === key}
      >
        {label}
      </button>
    {/each}
    <button
      class="preset-button"
      class:active={activePreset === 'custom'}
      on:click={handleToggleCustom}
      aria-pressed={activePreset === 'custom'}
      aria-expanded={showCustomRange}
      aria-controls="date-filter-custom-range"
    >
      期間指定
    </button>
  </div>

  {#if showCustomRange}
    <div class="custom-range" id="date-filter-custom-range">
      <label class="date-field">
        <span class="date-label">開始</span>
        <input
          type="date"
          value={fromDate}
          max={toDate}
          on:change={handleFromDateInput}
          aria-label="開始日"
        />
      </label>
      <span class="date-separator">〜</span>
      <label class="date-field">
        <span class="date-label">終了</span>
        <input
          type="date"
          value={toDate}
          min={fromDate}
          max={todayMax}
          on:change={handleToDateInput}
          aria-label="終了日"
        />
      </label>
      <button
        class="reset-button"
        on:click={handleResetToDefault}
        aria-label="日付フィルタをデフォルト（7日間）にリセット"
      >
        リセット
      </button>
    </div>
  {/if}
</div>

<style>
  .date-filter {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .date-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .preset-button {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 6px;
    background: var(--chip-bg, #f8fafc);
    color: var(--text-color, #475569);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    white-space: nowrap;
    line-height: 1.4;
  }

  .preset-button:hover {
    background: var(--chip-hover-bg, #e2e8f0);
  }

  .preset-button.active {
    background: var(--accent-color, #3b82f6);
    border-color: var(--accent-color, #3b82f6);
    color: #ffffff;
  }

  .preset-button.active:hover {
    background: var(--accent-hover, #2563eb);
    border-color: var(--accent-hover, #2563eb);
  }

  .preset-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-ring, rgba(59, 130, 246, 0.3));
  }

  .custom-range {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    background: var(--surface-bg, #f8fafc);
  }

  .date-field {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .date-label {
    font-size: 12px;
    color: var(--text-muted, #64748b);
    white-space: nowrap;
  }

  .date-field input[type='date'] {
    padding: 5px 8px;
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 4px;
    font-size: 13px;
    background: var(--input-bg, #ffffff);
    color: var(--text-color, #1e293b);
    transition: border-color 0.15s;
  }

  .date-field input[type='date']:focus {
    outline: none;
    border-color: var(--accent-color, #3b82f6);
    box-shadow: 0 0 0 2px var(--accent-ring, rgba(59, 130, 246, 0.2));
  }

  .date-separator {
    font-size: 13px;
    color: var(--text-muted, #94a3b8);
    padding: 0 2px;
  }

  .reset-button {
    padding: 4px 10px;
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: 4px;
    background: var(--button-bg, #ffffff);
    color: var(--text-muted, #64748b);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }

  .reset-button:hover {
    background: var(--button-hover-bg, #e2e8f0);
    color: var(--text-color, #334155);
  }

  .reset-button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-ring, rgba(59, 130, 246, 0.3));
  }
</style>
