// @codd-sprint: 42
// @codd-task: 42-1
// @codd-module: module:grid
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher<{
    change: { date_from: string | undefined; date_to: string | undefined };
  }>();

  function toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  function getDefaultDateFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toDateString(d);
  }

  function getDefaultDateTo(): string {
    return toDateString(new Date());
  }

  type Mode = 'last7' | 'custom' | 'all';

  let mode: Mode = 'last7';
  let customFrom: string = getDefaultDateFrom();
  let customTo: string = getDefaultDateTo();

  function computeRange(): { date_from: string | undefined; date_to: string | undefined } {
    if (mode === 'all') {
      return { date_from: undefined, date_to: undefined };
    }
    if (mode === 'last7') {
      return { date_from: getDefaultDateFrom(), date_to: getDefaultDateTo() };
    }
    return {
      date_from: customFrom || undefined,
      date_to: customTo || undefined,
    };
  }

  function handleModeChange(newMode: Mode) {
    mode = newMode;
    if (newMode === 'custom') {
      customFrom = getDefaultDateFrom();
      customTo = getDefaultDateTo();
    }
    dispatch('change', computeRange());
  }

  function handleCustomChange() {
    dispatch('change', computeRange());
  }

  onMount(() => {
    dispatch('change', computeRange());
  });
</script>

<div class="date-filter" role="group" aria-label="日付フィルタ">
  <div class="mode-buttons">
    <button
      class="mode-btn"
      class:active={mode === 'last7'}
      on:click={() => handleModeChange('last7')}
      type="button"
    >
      直近 7 日間
    </button>
    <button
      class="mode-btn"
      class:active={mode === 'custom'}
      on:click={() => handleModeChange('custom')}
      type="button"
    >
      期間指定
    </button>
    <button
      class="mode-btn"
      class:active={mode === 'all'}
      on:click={() => handleModeChange('all')}
      type="button"
    >
      全期間
    </button>
  </div>

  {#if mode === 'custom'}
    <div class="custom-range">
      <label class="range-label">
        <span>から</span>
        <input
          type="date"
          bind:value={customFrom}
          on:change={handleCustomChange}
          max={customTo || undefined}
        />
      </label>
      <label class="range-label">
        <span>まで</span>
        <input
          type="date"
          bind:value={customTo}
          on:change={handleCustomChange}
          min={customFrom || undefined}
        />
      </label>
    </div>
  {/if}
</div>

<style>
  .date-filter {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mode-buttons {
    display: flex;
    gap: 4px;
  }

  .mode-btn {
    padding: 4px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    color: #374151;
    transition: background 0.15s, border-color 0.15s;
  }

  .mode-btn:hover {
    background: #f3f4f6;
  }

  .mode-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }

  .custom-range {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .range-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #374151;
  }

  .range-label input[type='date'] {
    padding: 3px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 13px;
    color: #374151;
  }
</style>
