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

// @codd-trace: detail:grid_search §4.2, RBC-GRID-3
// NoteCard ロジック: カードクリックでエディタ画面へ遷移する。IPC 呼び出しなし。

import type { NoteMetadata } from '../types';

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

// RBC-GRID-3: カードクリックでエディタ画面（/?note=<id>）へ遷移
export function buildEditorHref(note: NoteMetadata): string {
  return `/?note=${encodeURIComponent(note.id)}`;
}

// キーボードアクセシビリティ: Enter キーでもクリックと同等の遷移を発火
export function handleKeydown(
  event: KeyboardEvent,
  onClick: () => void,
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
}
