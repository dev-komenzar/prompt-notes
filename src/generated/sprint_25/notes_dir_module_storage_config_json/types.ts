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

export interface Settings {
  notes_dir: string;
}

export interface UpdateSettingsArgs {
  notes_dir: string;
}

export interface UpdateSettingsResult {
  success: boolean;
}

export interface GetSettingsResult {
  notes_dir: string;
}

export interface SettingsValidationError {
  code: "DIR_NOT_FOUND" | "NO_WRITE_PERMISSION" | "UNKNOWN";
  message: string;
}
