// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: `module:grid` + `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: test:acceptance_criteria §4 (E2E Test Generation)
// テスト用ノートメタデータを生成するファクトリ。
// ファイル名規則 YYYY-MM-DDTHHMMSS に準拠した id を生成する (RB-3)。
import type { NoteMetadata } from '../../lib/types';

/** id = "YYYY-MM-DDTHHMMSS" 形式で NoteMetadata を生成する */
export function makeNoteMetadata(overrides: Partial<NoteMetadata> & { daysAgo?: number } = {}): NoteMetadata {
  const { daysAgo = 0, ...rest } = overrides;
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const id = formatNoteId(date);
  const created_at = date.toISOString();

  return {
    id,
    tags: [],
    created_at,
    preview: 'サンプルノート本文',
    ...rest,
  };
}

/** Date → "YYYY-MM-DDTHHMMSS" */
export function formatNoteId(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}${min}${ss}`;
}

/** 複数ノートをまとめて生成 */
export function makeNoteList(count: number, baseOverrides: Partial<NoteMetadata> = {}): NoteMetadata[] {
  return Array.from({ length: count }, (_, i) =>
    makeNoteMetadata({ ...baseOverrides, daysAgo: i }),
  );
}

/** 直近 n 日以内の id かどうかを検証 */
export function isWithinDays(id: string, days: number): boolean {
  const dateStr = `${id.slice(0, 10)}T${id.slice(11, 13)}:${id.slice(13, 15)}:${id.slice(15, 17)}`;
  const noteDate = new Date(dateStr);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return noteDate >= cutoff;
}
