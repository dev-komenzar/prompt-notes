// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 25-1
// @task-title: 新しい `notes_dir` を受け取り → ディレクトリ存在確認 + 書き込み権限検証（`module:storage` のバリデーション関数呼び出し）→ `config.json` に永続化。バリデーション失敗時はエラー返却。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import { invoke } from "@tauri-apps/api/core";
import type {
  GetSettingsResult,
  UpdateSettingsArgs,
  UpdateSettingsResult,
} from "./types";

/**
 * Fetches current settings from config.json via Rust backend.
 */
export async function getSettings(): Promise<GetSettingsResult> {
  return invoke<GetSettingsResult>("get_settings");
}

/**
 * Updates notes_dir setting.
 *
 * Rust backend performs:
 *   1. Directory existence check
 *   2. Write permission validation (module:storage validation function)
 *   3. Persist to config.json
 *
 * Throws a string error message if validation fails.
 */
export async function updateSettings(
  args: UpdateSettingsArgs
): Promise<UpdateSettingsResult> {
  return invoke<UpdateSettingsResult>("update_settings", {
    notes_dir: args.notes_dir,
  });
}
