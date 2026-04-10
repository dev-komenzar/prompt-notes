// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-2
// @task-title: edit
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Traceability: sprint=36, task=36-2, module=edit
// Deliverable: create_note → /edit/:filename 即時リダイレクト

import { invoke } from '@tauri-apps/api/core';
import { goto } from '$app/navigation';

export interface CreateNoteResult {
  filename: string;
  path: string;
}

/**
 * 新規ノートを作成し、/edit/:filename へ即時リダイレクトする。
 * ファイル名生成は Rust バックエンド (module:storage) が排他的に所有する。
 * フロントエンドはファイル名を生成せず、create_note の戻り値を使用する。
 */
export async function createNoteAndRedirect(): Promise<void> {
  const result = await invoke<CreateNoteResult>('create_note');
  await goto(`/edit/${encodeURIComponent(result.filename)}`);
}
