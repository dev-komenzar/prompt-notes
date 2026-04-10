// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 31-2
// @task-title: 500ms〜1000ms 範囲で最終調整）。`docChanged` 時のみ発火。frontmatter
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// traceability: sprint_31/task_31-2 — frontmatter/body 分離統合版 autosave

import { createAutoSaveExtension } from '@/generated/sprint_31/editorview_updatelistener_750ms/autosave';
import { parseFrontmatterAndBody, serializeFrontmatter } from './frontmatter';
import type { Frontmatter, ParsedNote } from './frontmatter';

export { createAutoSaveExtension };
export { parseFrontmatterAndBody, serializeFrontmatter };
export type { Frontmatter, ParsedNote };

/**
 * CodeMirror ドキュメント文字列から frontmatter/body を分離して
 * save_note IPC 呼び出し用の引数を構築する。
 *
 * autosave.ts (sprint_31/editorview_updatelistener_750ms) の
 * createAutoSaveExtension 内部で使用される parseFrontmatterAndBody を
 * 外部から直接利用したい場合のエントリポイント。
 */
export function buildSavePayload(
  filename: string,
  doc: string,
): { filename: string; frontmatter: Frontmatter; body: string } {
  const { frontmatter, body } = parseFrontmatterAndBody(doc);
  return { filename, frontmatter, body };
}

/**
 * frontmatter の tags を更新したドキュメント文字列を再構築する。
 * TagInput コンポーネントからタグが変更された際に CodeMirror
 * ドキュメントへ反映するためのヘルパー。
 */
export function rebuildDocWithTags(doc: string, tags: string[]): string {
  const { body } = parseFrontmatterAndBody(doc);
  const newFm = serializeFrontmatter({ tags });
  return `${newFm}\n${body}`;
}
