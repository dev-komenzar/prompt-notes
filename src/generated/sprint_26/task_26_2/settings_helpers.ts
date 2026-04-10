// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-2
// @task-title: 設定読み書きテスト
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface Settings {
  notes_dir: string;
}

export interface UpdateSettingsResult {
  success: boolean;
}

/** Platform-specific default notes directory, mirroring Rust resolve_notes_dir logic. */
export function defaultNotesDir(): string {
  const home = os.homedir();
  if (process.platform === "linux") {
    return path.join(home, ".local", "share", "promptnotes", "notes");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "promptnotes", "notes");
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

/** Platform-specific config file path, mirroring Rust settings store logic. */
export function configFilePath(): string {
  const home = os.homedir();
  if (process.platform === "linux") {
    return path.join(home, ".config", "promptnotes", "config.json");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "promptnotes", "config.json");
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

/** Creates a temporary directory for use as a custom notes_dir in tests. */
export function createTempNotesDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "promptnotes-test-"));
  return dir;
}

/** Removes a directory created by createTempNotesDir. */
export function removeTempDir(dir: string): void {
  if (dir.startsWith(os.tmpdir()) && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Reads the current config.json directly from the filesystem (bypassing IPC). */
export function readConfigFile(): Settings | null {
  const cfgPath = configFilePath();
  if (!fs.existsSync(cfgPath)) return null;
  const raw = fs.readFileSync(cfgPath, "utf-8");
  return JSON.parse(raw) as Settings;
}

/** Writes config.json directly (used to set up preconditions before calling IPC). */
export function writeConfigFile(settings: Settings): void {
  const cfgPath = configFilePath();
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  fs.writeFileSync(cfgPath, JSON.stringify(settings, null, 2), "utf-8");
}

/** Removes config.json so the next get_settings call returns the default. */
export function removeConfigFile(): void {
  const cfgPath = configFilePath();
  if (fs.existsSync(cfgPath)) {
    fs.unlinkSync(cfgPath);
  }
}

/** Saves the current config and returns a restore function. */
export function backupAndRestoreConfig(): () => void {
  const cfgPath = configFilePath();
  const backup = fs.existsSync(cfgPath)
    ? fs.readFileSync(cfgPath, "utf-8")
    : null;
  return () => {
    if (backup === null) {
      removeConfigFile();
    } else {
      fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
      fs.writeFileSync(cfgPath, backup, "utf-8");
    }
  };
}
