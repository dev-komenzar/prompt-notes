// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 61-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:61 task:61-1
// @codd-sprint: 61
// @codd-task: 61-1

/**
 * IPC Boundary Enforcement
 *
 * This module provides type-safe wrappers that enforce the Tauri IPC boundary.
 * All frontend ↔ Rust communication MUST go through these wrappers.
 * Direct use of @tauri-apps/api/core invoke() outside of src/lib/ipc.ts is prohibited.
 *
 * RBC-TAURI-1: 全ファイル操作はRustバックエンド経由
 * RBC-TAURI-2: @tauri-apps/plugin-fs の直接インポートは禁止
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================
// Shared Types (mirrors src/lib/types.ts — canonical source)
// ============================================================

export interface NoteMetadata {
  id: string;
  tags: string[];
  created_at: string;
  preview: string;
}

export interface Note {
  id: string;
  frontmatter: { tags: string[] };
  body: string;
  created_at: string;
}

export interface NoteFilter {
  tags?: string[];
  date_from?: string;
  date_to?: string;
}

export interface AppConfig {
  notes_dir: string;
}

// ============================================================
// IPC Command Wrappers
// These are the ONLY permitted paths to the Rust backend.
// ============================================================

/** RBC-EDITOR-4: create_note — Cmd+N / Ctrl+N で即座に新規ノート作成 */
export function createNote(): Promise<NoteMetadata> {
  return invoke<NoteMetadata>('create_note');
}

/**
 * RBC-STORAGE-3: save_note — 自動保存必須。デバウンス後に呼び出す。
 * frontmatter は tags のみ (RBC-STORAGE-2)。
 */
export function saveNote(
  id: string,
  frontmatter: { tags: string[] },
  body: string,
): Promise<void> {
  return invoke<void>('save_note', { id, frontmatter, body });
}

/** RBC-GRID-3: read_note — カードクリックでエディタ遷移後に呼び出す */
export function readNote(id: string): Promise<Note> {
  return invoke<Note>('read_note', { id });
}

export function deleteNote(id: string): Promise<void> {
  return invoke<void>('delete_note', { id });
}

/**
 * RBC-GRID-1 / RBC-GRID-2: list_notes — デフォルト直近7日間フィルタを含むフィルタを渡す。
 * タグ・日付フィルタは必須機能。
 */
export function listNotes(filter?: NoteFilter): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('list_notes', { filter });
}

/**
 * RBC-GRID-2: search_notes — 全文検索（ファイル全走査）は必須機能。
 * Rustバックエンドがファイル全走査を実行。フロントエンド独自検索は禁止。
 */
export function searchNotes(query: string, filter?: NoteFilter): Promise<NoteMetadata[]> {
  return invoke<NoteMetadata[]>('search_notes', { query, filter });
}

/**
 * RBC-SETTINGS-1: get_config — 設定はRustバックエンド経由で取得。
 * localStorage等への保存は禁止。
 */
export function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_config');
}

/**
 * RBC-SETTINGS-1: set_config — 設定変更（保存ディレクトリ）はRustバックエンド経由で永続化。
 * フロントエンド単独でのファイルパス操作は禁止。
 */
export function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>('set_config', { config });
}
