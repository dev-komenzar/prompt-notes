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

/**
 * Settings read/write unit tests.
 *
 * These tests exercise the get_settings / update_settings IPC boundary and
 * the underlying config.json persistence contract defined in
 * docs/detailed_design/storage_fileformat_design.md §3.2 and
 * docs/design/system_design.md §2.3.
 *
 * Tauri IPC is invoked via the tauri-test-utils shim so the same assertions
 * run in both the Tauri integration harness and a Node.js unit harness with
 * mocked invoke().
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import {
  Settings,
  UpdateSettingsResult,
  defaultNotesDir,
  configFilePath,
  createTempNotesDir,
  removeTempDir,
  readConfigFile,
  writeConfigFile,
  removeConfigFile,
  backupAndRestoreConfig,
} from "./settings_helpers";

// ---------------------------------------------------------------------------
// Minimal invoke() shim — replaced by real @tauri-apps/api/core in integration
// ---------------------------------------------------------------------------

type InvokeImpl = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

let _invoke: InvokeImpl = async (cmd, args) => {
  // Stub replaced in integration suite via globalThis.__tauriInvoke
  throw new Error(`invoke('${cmd}') not wired — run inside Tauri test harness`);
};

if (typeof globalThis !== "undefined" && (globalThis as any).__tauriInvoke) {
  _invoke = (globalThis as any).__tauriInvoke as InvokeImpl;
}

async function getSettings(): Promise<Settings> {
  return _invoke("get_settings") as Promise<Settings>;
}

async function updateSettings(settings: Settings): Promise<UpdateSettingsResult> {
  return _invoke("update_settings", { notes_dir: settings.notes_dir }) as Promise<UpdateSettingsResult>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let restoreConfig: () => void;
let tempDirs: string[] = [];

function allocTempDir(): string {
  const d = createTempNotesDir();
  tempDirs.push(d);
  return d;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("settings: get_settings", () => {
  beforeEach(() => {
    restoreConfig = backupAndRestoreConfig();
    removeConfigFile();
  });

  afterEach(() => {
    restoreConfig();
    tempDirs.forEach(removeTempDir);
    tempDirs = [];
  });

  it("returns platform default notes_dir when config.json does not exist", async () => {
    const settings = await getSettings();
    expect(settings.notes_dir).toBe(defaultNotesDir());
  });

  it("returns previously persisted notes_dir when config.json exists", async () => {
    const customDir = allocTempDir();
    writeConfigFile({ notes_dir: customDir });

    const settings = await getSettings();
    expect(settings.notes_dir).toBe(customDir);
  });

  it("notes_dir is a non-empty string", async () => {
    const settings = await getSettings();
    expect(typeof settings.notes_dir).toBe("string");
    expect(settings.notes_dir.length).toBeGreaterThan(0);
  });

  it("default notes_dir is absolute path", async () => {
    const settings = await getSettings();
    expect(path.isAbsolute(settings.notes_dir)).toBe(true);
  });

  it("default notes_dir ends with promptnotes/notes segment", async () => {
    const settings = await getSettings();
    const normalized = settings.notes_dir.replace(/\\/g, "/");
    expect(normalized).toMatch(/promptnotes\/notes$/);
  });
});

describe("settings: update_settings", () => {
  beforeEach(() => {
    restoreConfig = backupAndRestoreConfig();
    removeConfigFile();
  });

  afterEach(() => {
    restoreConfig();
    tempDirs.forEach(removeTempDir);
    tempDirs = [];
  });

  it("returns success:true on valid directory path", async () => {
    const customDir = allocTempDir();
    const result = await updateSettings({ notes_dir: customDir });
    expect(result.success).toBe(true);
  });

  it("persists notes_dir to config.json after update", async () => {
    const customDir = allocTempDir();
    await updateSettings({ notes_dir: customDir });

    const onDisk = readConfigFile();
    expect(onDisk).not.toBeNull();
    expect(onDisk!.notes_dir).toBe(customDir);
  });

  it("get_settings returns updated notes_dir after update", async () => {
    const customDir = allocTempDir();
    await updateSettings({ notes_dir: customDir });

    const settings = await getSettings();
    expect(settings.notes_dir).toBe(customDir);
  });

  it("successive updates overwrite previous value", async () => {
    const dir1 = allocTempDir();
    const dir2 = allocTempDir();

    await updateSettings({ notes_dir: dir1 });
    await updateSettings({ notes_dir: dir2 });

    const settings = await getSettings();
    expect(settings.notes_dir).toBe(dir2);

    const onDisk = readConfigFile();
    expect(onDisk!.notes_dir).toBe(dir2);
  });

  it("update creates config directory if it does not exist", async () => {
    const cfgPath = configFilePath();
    const cfgDir = path.dirname(cfgPath);
    // Verify Rust side creates parent dirs — observable via config file presence
    const customDir = allocTempDir();
    await updateSettings({ notes_dir: customDir });

    expect(fs.existsSync(cfgPath)).toBe(true);
    expect(fs.existsSync(cfgDir)).toBe(true);
  });

  it("config.json is valid JSON after update", async () => {
    const customDir = allocTempDir();
    await updateSettings({ notes_dir: customDir });

    const raw = fs.readFileSync(configFilePath(), "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("config.json contains notes_dir key after update", async () => {
    const customDir = allocTempDir();
    await updateSettings({ notes_dir: customDir });

    const parsed = JSON.parse(fs.readFileSync(configFilePath(), "utf-8"));
    expect(Object.keys(parsed)).toContain("notes_dir");
  });
});

describe("settings: path security", () => {
  beforeEach(() => {
    restoreConfig = backupAndRestoreConfig();
    removeConfigFile();
  });

  afterEach(() => {
    restoreConfig();
    tempDirs.forEach(removeTempDir);
    tempDirs = [];
  });

  it("rejects notes_dir containing path traversal sequence (../)", async () => {
    await expect(
      updateSettings({ notes_dir: "/tmp/safe/../../../etc/passwd" })
    ).rejects.toThrow();
  });

  it("rejects empty string notes_dir", async () => {
    await expect(
      updateSettings({ notes_dir: "" })
    ).rejects.toThrow();
  });

  it("rejects notes_dir that is a file rather than a directory", async () => {
    const tmpFile = path.join(os.tmpdir(), `promptnotes-test-file-${Date.now()}`);
    fs.writeFileSync(tmpFile, "not a directory");
    try {
      await expect(
        updateSettings({ notes_dir: tmpFile })
      ).rejects.toThrow();
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

describe("settings: config does not affect notes file format", () => {
  beforeEach(() => {
    restoreConfig = backupAndRestoreConfig();
  });

  afterEach(() => {
    restoreConfig();
    tempDirs.forEach(removeTempDir);
    tempDirs = [];
  });

  it("config.json schema contains only notes_dir key (no extra metadata)", async () => {
    const customDir = allocTempDir();
    await updateSettings({ notes_dir: customDir });

    const parsed = JSON.parse(fs.readFileSync(configFilePath(), "utf-8"));
    // notes_dir is the only permitted key per design (§3.4)
    expect(Object.keys(parsed)).toEqual(["notes_dir"]);
  });

  it("notes_dir from get_settings matches what was written to config.json", async () => {
    const customDir = allocTempDir();
    await updateSettings({ notes_dir: customDir });

    const fromIpc = (await getSettings()).notes_dir;
    const fromDisk = readConfigFile()!.notes_dir;
    expect(fromIpc).toBe(fromDisk);
  });
});
