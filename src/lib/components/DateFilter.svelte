<script lang="ts">
  interface Props {
    fromDate: string | null;
    toDate: string | null;
    onChange: (from: string | null, to: string | null) => void;
  }

  let { fromDate, toDate, onChange }: Props = $props();

  function handleFromChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onChange(target.value || null, toDate);
  }

  function handleToChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onChange(fromDate, target.value || null);
  }
</script>

<div class="date-filter" data-testid="date-filter">
  <input
    type="date"
    value={fromDate ?? ""}
    oninput={handleFromChange}
    aria-label="From date"
  />
  <span class="date-sep">–</span>
  <input
    type="date"
    value={toDate ?? ""}
    oninput={handleToChange}
    aria-label="To date"
  />
</div>

<style>
  .date-filter {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  input[type="date"] {
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 0.8rem;
  }
  .date-sep {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
</style>
