// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 23-4
// @task-title: config.json`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint=23, task=23-4, deliverable=config.json read/write manager
import { initConfig, readConfig, readNotesDir, writeNotesDir } from '../config/config-io';
import { getDefaultNotesDir, getConfigPath } from '../config/config-paths';
import { isNotesDirSyntacticallyValid, migrateRawConfig } from '../config/config-schema';
import type { RawConfig } from '../config/config-schema';
import { loadSettings, saveNotesDir, isValidNotesDir } from '../ui_foundation/settings-helpers';
import type { Settings } from '../ui_foundation/settings-types';

export interface ConfigJsonReadResult {
  success: boolean;
  config: RawConfig | null;
  notesDir: string;
  configPath: string;
  error?: string;
}

export interface ConfigJsonWriteResult {
  success: boolean;
  notesDir: string;
  error?: string;
}

export interface ConfigJsonManagerState {
  initialized: boolean;
  notesDir: string;
  configPath: string;
  lastError: string | null;
}

export class ConfigJsonManager {
  private state: ConfigJsonManagerState = {
    initialized: false,
    notesDir: '',
    configPath: '',
    lastError: null,
  };

  async initialize(): Promise<ConfigJsonReadResult> {
    const configPath = getConfigPath();
    try {
      await initConfig();
      const config = await readConfig();
      const notesDir = config?.notes_dir ?? getDefaultNotesDir();
      this.state = {
        initialized: true,
        notesDir,
        configPath,
        lastError: null,
      };
      return { success: true, config: config ? migrateRawConfig(config) : null, notesDir, configPath };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      this.state = { ...this.state, initialized: false, configPath, lastError: error };
      return { success: false, config: null, notesDir: getDefaultNotesDir(), configPath, error };
    }
  }

  async readNotesDir(): Promise<ConfigJsonReadResult> {
    const configPath = getConfigPath();
    try {
      const notesDir = await readNotesDir();
      this.state = { ...this.state, notesDir, configPath, lastError: null };
      const config = await readConfig();
      return { success: true, config, notesDir, configPath };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      this.state = { ...this.state, lastError: error };
      return { success: false, config: null, notesDir: getDefaultNotesDir(), configPath, error };
    }
  }

  async writeNotesDir(newNotesDir: string): Promise<ConfigJsonWriteResult> {
    if (!isNotesDirSyntacticallyValid(newNotesDir)) {
      const error = `Invalid notes_dir path: ${newNotesDir}`;
      this.state = { ...this.state, lastError: error };
      return { success: false, notesDir: this.state.notesDir, error };
    }
    try {
      await writeNotesDir(newNotesDir);
      this.state = { ...this.state, notesDir: newNotesDir, lastError: null };
      return { success: true, notesDir: newNotesDir };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      this.state = { ...this.state, lastError: error };
      return { success: false, notesDir: this.state.notesDir, error };
    }
  }

  async syncFromSettings(): Promise<ConfigJsonWriteResult> {
    try {
      const settings = await loadSettings();
      if (!settings || !settings.notes_dir) {
        return { success: false, notesDir: this.state.notesDir, error: 'No settings available' };
      }
      return this.writeNotesDir(settings.notes_dir);
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return { success: false, notesDir: this.state.notesDir, error };
    }
  }

  async syncToSettings(): Promise<{ success: boolean; settings: Settings | null; error?: string }> {
    try {
      const notesDir = await readNotesDir();
      if (!isValidNotesDir(notesDir)) {
        return { success: false, settings: null, error: `Invalid notes_dir: ${notesDir}` };
      }
      const result = await saveNotesDir(notesDir);
      if (!result.success) {
        return { success: false, settings: null, error: 'Failed to save to settings store' };
      }
      const settings = await loadSettings();
      return { success: true, settings };
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      return { success: false, settings: null, error };
    }
  }

  getState(): Readonly<ConfigJsonManagerState> {
    return { ...this.state };
  }

  getConfigPath(): string {
    return getConfigPath();
  }

  getDefaultNotesDir(): string {
    return getDefaultNotesDir();
  }
}

export const configJsonManager = new ConfigJsonManager();
