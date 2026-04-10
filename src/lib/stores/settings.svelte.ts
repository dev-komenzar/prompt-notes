import { getSettings, updateSettings } from '../api';
import type { Config } from '../types';

interface SettingsState {
  config: Config | null;
  loading: boolean;
  error: string | null;
}

let state = $state<SettingsState>({
  config: null,
  loading: false,
  error: null
});

export function getSettingsState() {
  return state;
}

export async function loadSettings(): Promise<void> {
  state.loading = true;
  state.error = null;
  try {
    state.config = await getSettings();
  } catch (e) {
    state.error = e instanceof Error ? e.message : String(e);
  } finally {
    state.loading = false;
  }
}

export async function saveSettings(config: Config): Promise<void> {
  state.loading = true;
  state.error = null;
  try {
    await updateSettings(config);
    state.config = config;
  } catch (e) {
    state.error = e instanceof Error ? e.message : String(e);
  } finally {
    state.loading = false;
  }
}
