import { writable, get } from "svelte/store";
import type { AppConfig } from "$lib/utils/tauri-commands";
import {
  getConfig as getConfigCmd,
  setConfig as setConfigCmd,
} from "$lib/utils/tauri-commands";
import { handleCommandError } from "$lib/utils/error-handler";

export const config = writable<AppConfig>({ notes_directory: "" });

export async function loadConfig(): Promise<void> {
  try {
    const cfg = await getConfigCmd();
    config.set(cfg);
  } catch (error) {
    handleCommandError(error);
  }
}

export async function saveConfig(newConfig: AppConfig): Promise<void> {
  try {
    await setConfigCmd(newConfig);
    config.set(newConfig);
  } catch (error) {
    handleCommandError(error);
  }
}

export function getNotesDirectory(): string {
  return get(config).notes_directory;
}
