import { writable } from "svelte/store";

export interface FilterState {
  fromDate: string | null;
  toDate: string | null;
  tags: string[];
  query: string;
}

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export const filters = writable<FilterState>({
  fromDate: defaultFromDate(),
  toDate: null,
  tags: [],
  query: "",
});

export function setDateRange(from: string | null, to: string | null): void {
  filters.update((f) => ({ ...f, fromDate: from, toDate: to }));
}

export function setTags(tags: string[]): void {
  filters.update((f) => ({ ...f, tags }));
}

export function toggleTag(tag: string): void {
  filters.update((f) => {
    const idx = f.tags.indexOf(tag);
    if (idx >= 0) {
      return { ...f, tags: f.tags.filter((t) => t !== tag) };
    }
    return { ...f, tags: [...f.tags, tag] };
  });
}

export function setQuery(query: string): void {
  filters.update((f) => ({ ...f, query }));
}

export function resetFilters(): void {
  filters.set({
    fromDate: defaultFromDate(),
    toDate: null,
    tags: [],
    query: "",
  });
}
