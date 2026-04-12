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

// @codd-trace: detail:grid_search §4.5, RBC-GRID-1, RBC-GRID-2, RBC-GRID-3
// GridView ロジック: filtersStore 購読 → IPC 呼び出し → notesStore 更新のオーケストレーション。
// Svelte コンポーネントの <script lang="ts"> として利用する。

import type { Unsubscriber } from 'svelte/store';
import { filtersStore } from '../stores/filters';
import { notesStore } from '../stores/notes';
import { listNotes, searchNotes } from '../ipc';
import type { GridFilters } from '../stores/filters';
import type { NoteMetadata, NoteFilter } from '../types';

export interface GridViewState {
  loading: boolean;
  error: string | null;
}

async function fetchNotes(filters: GridFilters): Promise<NoteMetadata[]> {
  const filter: NoteFilter = {
    tags: filters.tags && filters.tags.length > 0 ? filters.tags : undefined,
    date_from: filters.date_from,
    date_to: filters.date_to,
  };

  // query が空なら list_notes（メタデータフィルタのみ）、非空なら search_notes（ファイル全走査）
  return filters.query
    ? searchNotes(filters.query, filter)
    : listNotes(filter);
}

export interface GridViewController {
  subscribe(): Unsubscriber;
  destroy(): void;
}

export function createGridViewController(
  onStateChange: (state: GridViewState) => void,
): GridViewController {
  let unsubscribe: Unsubscriber | undefined;

  function subscribe(): Unsubscriber {
    // filtersStore のいずれかのプロパティ変更でデータ再取得
    unsubscribe = filtersStore.subscribe(async filters => {
      onStateChange({ loading: true, error: null });
      try {
        const notes = await fetchNotes(filters);
        notesStore.set(notes);
        onStateChange({ loading: false, error: null });
      } catch (err) {
        onStateChange({
          loading: false,
          error: err instanceof Error ? err.message : 'データ取得に失敗しました',
        });
      }
    });
    return unsubscribe;
  }

  function destroy(): void {
    unsubscribe?.();
  }

  return { subscribe, destroy };
}
