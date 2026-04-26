import { get } from "svelte/store";
import { focusedIndex } from "../focus";
import { notes } from "../notes";
import { filters } from "../filters";

export type TargetContext = "editor" | "search" | "none";

export function classifyTarget(event: KeyboardEvent): TargetContext {
  const target = event.target as HTMLElement | null;
  if (!target) return "none";
  if (target.closest(".cm-editor")) return "editor";
  if (target.closest('[data-testid="search-input"]')) return "search";
  return "none";
}

export interface DispatcherHooks {
  getEditingFilename(): string | null;
  setEditingFilename(filename: string | null): void;
  exitEditing(filename: string): void;
}

export async function handleKey(
  event: KeyboardEvent,
  hooks: DispatcherHooks,
): Promise<void> {
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const ctx = classifyTarget(event);

  const editing = hooks.getEditingFilename();
  if (editing !== null && event.key === "Escape" && ctx !== "search") {
    event.preventDefault();
    hooks.exitEditing(editing);
    return;
  }

  if (ctx === "editor" || ctx === "search") return;
  if (editing !== null) return;

  const idx = get(focusedIndex);
  const list = get(notes);

  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      if (idx === null) {
        if (list.length > 0) focusedIndex.set(0);
      } else {
        focusedIndex.set(Math.max(idx - 1, 0));
      }
      break;

    case "ArrowDown":
      event.preventDefault();
      if (idx === null) {
        if (list.length > 0) focusedIndex.set(0);
      } else if (idx < list.length - 1) {
        focusedIndex.set(idx + 1);
      } else {
        // 最下部到達: fromDate を撤去して全期間を再フェッチ
        // (reactive $effect が filters 変化で list_notes を再発行する)
        const currentFilters = get(filters);
        if (currentFilters.fromDate !== null) {
          filters.update((f) => ({ ...f, fromDate: null }));
        }
      }
      break;

    case "Enter":
      if (idx !== null && list[idx]) {
        event.preventDefault();
        hooks.setEditingFilename(list[idx].filename);
      }
      break;

    case "Escape":
      if (idx !== null) focusedIndex.set(null);
      break;

    case "c":
      if (idx !== null) {
        const btn = document.querySelector<HTMLButtonElement>(
          '[data-testid="note-card"][data-focused="true"] [data-testid="copy-button"]',
        );
        btn?.click();
      }
      break;

    case "d":
    case "Delete":
      if (idx !== null && list[idx]) {
        event.preventDefault();
        triggerDeleteButton();
      }
      break;
  }
}

function triggerDeleteButton(): void {
  const btn = document.querySelector<HTMLButtonElement>(
    '[data-testid="note-card"][data-focused="true"] [data-testid="delete-button"]',
  );
  btn?.click();
}
