import { writable, get } from "svelte/store";
import { getConfig as getConfigCmd } from "../shell/tauri-commands";
import type { SetConfigResult } from "../shell/tauri-commands";
import { handleCommandError } from "../shell/error-handler";

export interface ConfigState {
  notes_directory: string;
  pendingPath: string | null;
  moveExisting: boolean;
  lastResult: SetConfigResult | null;
}

export const config = writable<ConfigState>({
  notes_directory: "",
  pendingPath: null,
  moveExisting: false,
  lastResult: null,
});

export async function loadConfig(): Promise<void> {
  try {
    const cfg = await getConfigCmd();
    config.update((s) => ({ ...s, notes_directory: cfg.notes_directory }));
  } catch (error) {
    handleCommandError(error);
  }
}

export function setPendingPath(path: string | null): void {
  config.update((s) => ({ ...s, pendingPath: path }));
}

export function setMoveExisting(val: boolean): void {
  config.update((s) => ({ ...s, moveExisting: val }));
}

export function applyConfigResult(result: SetConfigResult, newDir: string): void {
  config.update((s) => ({
    ...s,
    notes_directory: newDir,
    pendingPath: null,
    lastResult: result,
  }));
}

export function getNotesDirectory(): string {
  return get(config).notes_directory;
}
