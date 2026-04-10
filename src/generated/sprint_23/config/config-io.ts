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
// config.json の読み書きオーケストレーション。
// 実際のファイル I/O は Rust バックエンド（get_settings / update_settings IPC）が実行する。
// フロントエンドは直接 ~/.config/promptnotes/config.json にアクセスしない（NNC-2 準拠）。

import { getSettings, updateSettings } from '@/generated/sprint_23/ui_foundation/settings-api';
import type { Settings } from '@/generated/sprint_23/ui_foundation/settings-types';
import {
  isRawConfig,
  migrateRawConfig,
  isNotesDirSyntacticallyValid,
} from './config-schema';
import type { RawConfig } from './config-schema';
import { detectPlatform } from './config-paths';

/**
 * Rust バックエンドから config.json を読み込み、RawConfig として返す。
 * 設定ファイルが存在しない場合はバックエンドがデフォルト値で初期化したものを返す。
 */
export async function readConfig(): Promise<RawConfig> {
  const result: Settings = await getSettings();
  const partial: Partial<RawConfig> = { notes_dir: result.notes_dir };

  if (isRawConfig(partial)) return partial as RawConfig;

  const platform = detectPlatform();
  return migrateRawConfig(partial, platform);
}

/**
 * notes_dir を Rust バックエンド経由で config.json に永続化する。
 * バリデーション（ディレクトリ存在確認・書き込み権限確認）は Rust 側で実行される。
 * 構文エラーはフロントエンドで早期検出する。
 */
export async function writeNotesDir(notesDir: string): Promise<void> {
  if (!isNotesDirSyntacticallyValid(notesDir)) {
    throw new Error(`notes_dir が不正な値です: "${notesDir}"`);
  }
  await updateSettings({ notes_dir: notesDir });
}

/**
 * 初回起動時の config 初期化。
 * Rust バックエンドが config.json を作成済みでなければデフォルト値で作成する。
 * フロントエンドは結果を受け取るのみ。
 */
export async function initConfig(): Promise<RawConfig> {
  return readConfig();
}

/** 現在の notes_dir 設定値のみを取得する簡易ヘルパー */
export async function readNotesDir(): Promise<string> {
  const config = await readConfig();
  return config.notes_dir;
}
