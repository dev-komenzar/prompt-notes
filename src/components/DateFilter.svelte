<!-- Sprint 20 – Date range filter for grid view -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { getDefaultDateRange, formatDateParam } from "../lib/date-utils";

  export let from: string = "";
  export let to: string = "";

  const dispatch = createEventDispatcher<{
    change: { from: string; to: string };
  }>();

  function handleFromChange(e: Event) {
    from = (e.target as HTMLInputElement).value;
    dispatch("change", { from, to });
  }

  function handleToChange(e: Event) {
    to = (e.target as HTMLInputElement).value;
    dispatch("change", { from, to });
  }

  function setPreset(days: number) {
    const range = getDefaultDateRange(days);
    from = range.from;
    to = range.to;
    dispatch("change", { from, to });
  }

  function clearDates() {
    from = "";
    to = "";
    dispatch("change", { from, to });
  }
</script>

<div class="date-filter">
  <div class="date-presets">
    <button class="preset-btn" on:click={() => setPreset(7)}>7d</button>
    <button class="preset-btn" on:click={() => setPreset(30)}>30d</button>
    <button class="preset-btn" on:click={() => setPreset(90)}>90d</button>
    <button class="preset-btn" on:click={clearDates}>All</button>
  </div>
  <div class="date-inputs">
    <input
      type="date"
      class="date-input"
      value={from}
      on:change={handleFromChange}
      title="From date"
    />
    <span class="date-separator">–</span>
    <input
      type="date"
      class="date-input"
      value={to}
      on:change={handleToChange}
      title="To date"
    />
  </div>
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .date-presets {
    display: flex;
    gap: 4px;
  }

  .preset-btn {
    font-size: 12px;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .preset-btn:hover {
    border-color: var(--accent-color);
    color: var(--text-primary);
  }

  .date-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .date-input {
    font-size: 12px;
    padding: 4px 8px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-surface);
    color: var(--text-primary);
    outline: none;
  }

  .date-input:focus {
    border-color: var(--accent-color);
  }

  /* Style the date input for dark mode */
  .date-input::-webkit-calendar-picker-indicator {
    filter: invert(0.8);
  }

  .date-separator {
    color: var(--text-muted);
    font-size: 14px;
  }
</style>
