<script lang="ts">
  import { filters } from "$lib/stores/filters";
  import { dateToFilenamePrefix } from "$lib/utils/timestamp";

  let fromDate = "";
  let toDate = "";

  function applyDates() {
    filters.update((f) => ({
      ...f,
      fromDate: fromDate ? dateToFilenamePrefix(new Date(fromDate + "T00:00:00")) : f.fromDate,
      toDate: toDate ? dateToFilenamePrefix(new Date(toDate + "T23:59:59")) : f.toDate,
    }));
  }
</script>

<div class="date-filter">
  <input type="date" bind:value={fromDate} on:change={applyDates} />
  <span>–</span>
  <input type="date" bind:value={toDate} on:change={applyDates} />
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  input[type="date"] {
    padding: 4px 8px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text);
    width: 130px;
  }
  span { color: var(--text-muted); }
</style>
