// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-trace: detail:grid_search §4.3, RBC-GRID-2
// FilterBar ロジック: タグフィルタ・日付範囲フィルタ・クリアボタンを管理する。

import { get } from 'svelte/store';
import { filtersStore, resetFilters } from '../stores/filters';
import { notesStore } from '../stores/notes';

// notesStore の現在値からユニークなタグ一覧をソート済みで返す
export function deriveAllTags(): string[] {
  const notes = get(notesStore);
  return [...new Set(notes.flatMap(n => n.tags))].sort();
}

// タグをトグル選択して filtersStore に反映（AND フィルタ）
export function toggleTag(tag: string): void {
  filtersStore.update(f => {
    const current = f.tags ?? [];
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    return { ...f, tags: next };
  });
}

export function setDateFrom(date: string): void {
  filtersStore.update(f => ({ ...f, date_from: date }));
}

export function setDateTo(date: string): void {
  filtersStore.update(f => ({ ...f, date_to: date }));
}

// フィルタクリア: デフォルト直近7日間に戻す（RBC-GRID-1 維持）
export { resetFilters };
