// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 設定ファイル読み込み → `Settings { notes_dir }` 返却。ファイル不在時はデフォルト値を返却。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability: sprint:24 task:24-1 module:settings
import { invoke } from "@tauri-apps/api/core";
import type { Settings } from "./types";
import {
  DEFAULT_NOTES_DIR_LINUX,
  DEFAULT_NOTES_DIR_MACOS,
} from "./types";

function getDefaultNotesDir(): string {
  const platform =
    typeof navigator !== "undefined" ? navigator.platform : "";
  if (platform.toLowerCase().includes("mac")) {
    return DEFAULT_NOTES_DIR_MACOS;
  }
  return DEFAULT_NOTES_DIR_LINUX;
}

export async function getSettings(): Promise<Settings> {
  try {
    const settings = await invoke<Settings>("get_settings");
    return settings;
  } catch {
    return { notes_dir: getDefaultNotesDir() };
  }
}
