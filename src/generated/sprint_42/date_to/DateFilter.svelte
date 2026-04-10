<!-- @codd-sprint: 42, task: 42-2 -->
<!-- DateFilter.svelte: 日付範囲セレクタ。date_to = 当日デフォルト。「全期間」でフィルタ解除。 -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher<{
    change: { date_from: string | undefined; date_to: string | undefined };
  }>();

  type FilterMode = 'last7' | 'custom' | 'all';

  function toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  function getToday(): string {
    return toDateString(new Date());
  }

  function get7DaysAgo(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toDateString(d);
  }

  let mode: FilterMode = 'last7';
  let customFrom: string = get7DaysAgo();
  let customTo: string = getToday();

  $: effectiveDateFrom = mode === 'all' ? undefined : mode === 'last7' ? get7DaysAgo() : customFrom || undefined;
  $: effectiveDateTo = mode === 'all' ? undefined : mode === 'last7' ? getToday() : customTo || undefined;

  function emitChange() {
    dispatch('change', { date_from: effectiveDateFrom, date_to: effectiveDateTo });
  }

  function setMode(newMode: FilterMode) {
    mode = newMode;
    if (newMode === 'custom' && !customFrom) {
      customFrom = get7DaysAgo();
    }
    if (newMode === 'custom' && !customTo) {
      customTo = getToday();
    }
    emitChange();
  }

  function handleCustomFromChange(e: Event) {
    customFrom = (e.target as HTMLInputElement).value;
    emitChange();
  }

  function handleCustomToChange(e: Event) {
    customTo = (e.target as HTMLInputElement).value;
    emitChange();
  }

  onMount(() => {
    emitChange();
  });
</script>

<div class="date-filter">
  <div class="mode-buttons">
    <button
      class="mode-btn"
      class:active={mode === 'last7'}
      on:click={() => setMode('last7')}
      aria-pressed={mode === 'last7'}
    >
      直近7日間
    </button>
    <button
      class="mode-btn"
      class:active={mode === 'custom'}
      on:click={() => setMode('custom')}
      aria-pressed={mode === 'custom'}
    >
      期間指定
    </button>
    <button
      class="mode-btn"
      class:active={mode === 'all'}
      on:click={() => setMode('all')}
      aria-pressed={mode === 'all'}
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
          value={customFrom}
          max={customTo || undefined}
          on:change={handleCustomFromChange}
          class="date-input"
        />
      </label>
      <span class="range-sep">〜</span>
      <label class="range-label">
        <span>まで</span>
        <input
          type="date"
          value={customTo}
          min={customFrom || undefined}
          on:change={handleCustomToChange}
          class="date-input"
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
    border-radius: 9999px;
    background: transparent;
    font-size: 0.8rem;
    cursor: pointer;
    color: #374151;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .mode-btn:hover {
    background: #f3f4f6;
  }

  .mode-btn.active {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
  }

  .custom-range {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .range-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .date-input {
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.8rem;
    color: #374151;
    background: #fff;
  }

  .range-sep {
    color: #9ca3af;
    font-size: 0.8rem;
  }
</style>
