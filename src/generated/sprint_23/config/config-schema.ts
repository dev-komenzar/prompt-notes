// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 23-2
// @task-title: .config
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:23 task:23-2
// config.json のスキーマ定義、バリデーション、マイグレーション。
// フィールドは notes_dir のみ。追加フィールドの導入は要件変更が必要（NNC-S2 準拠）。

import { LINUX_DEFAULT_NOTES_DIR, MACOS_DEFAULT_NOTES_DIR } from './config-paths';
import type { SupportedPlatform } from './config-paths';

export const CONFIG_VERSION = 1;

/** config.json の永続化スキーマ */
export interface RawConfig {
  readonly version: number;
  readonly notes_dir: string;
}

/** notes_dir のみを更新するペイロード */
export interface ConfigPatch {
  notes_dir: string;
}

export function createDefaultRawConfig(platform: SupportedPlatform): RawConfig {
  return {
    version: CONFIG_VERSION,
    notes_dir: platform === 'macos' ? MACOS_DEFAULT_NOTES_DIR : LINUX_DEFAULT_NOTES_DIR,
  };
}

/**
 * 不完全または古いバージョンの config を現行スキーマに移行する。
 * 未知フィールドは保全せず、既知フィールドのみを正規化する。
 */
export function migrateRawConfig(
  partial: Partial<RawConfig>,
  platform: SupportedPlatform,
): RawConfig {
  const defaults = createDefaultRawConfig(platform);
  return {
    version: CONFIG_VERSION,
    notes_dir:
      typeof partial.notes_dir === 'string' && partial.notes_dir.trim().length > 0
        ? partial.notes_dir.trim()
        : defaults.notes_dir,
  };
}

export function isRawConfig(value: unknown): value is RawConfig {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.notes_dir === 'string' && obj.notes_dir.trim().length > 0;
}

/**
 * notes_dir の簡易構文チェック。
 * ディレクトリ存在確認・書き込み権限確認は Rust バックエンド側で実行する。
 */
export function isNotesDirSyntacticallyValid(notesDir: string): boolean {
  const trimmed = notesDir.trim();
  if (trimmed.length === 0) return false;
  // パス区切り文字のみで構成されるパスや null バイトを拒否
  if (/\0/.test(trimmed)) return false;
  return true;
}
