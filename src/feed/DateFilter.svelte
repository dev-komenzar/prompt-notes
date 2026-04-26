<script lang="ts">
  import { setDateRange } from "./filters";

  interface Props {
    fromDate: string | null;
    toDate: string | null;
  }

  let { fromDate, toDate }: Props = $props();

  function handleFromChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    setDateRange(val || null, toDate);
  }

  function handleToChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    setDateRange(fromDate, val || null);
  }
</script>

<div class="date-filter" data-testid="date-filter">
  <input
    type="date"
    class="date-input"
    data-testid="date-from"
    value={fromDate ?? ""}
    on:change={handleFromChange}
  />
  <span class="date-sep">–</span>
  <input
    type="date"
    class="date-input"
    data-testid="date-to"
    value={toDate ?? ""}
    on:change={handleToChange}
  />
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .date-input {
    font-size: 12px;
    padding: 2px 6px;
    max-width: 130px;
  }

  .date-sep {
    color: var(--text-secondary);
    font-size: 12px;
  }
</style>
