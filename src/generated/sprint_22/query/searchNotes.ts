// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-1
// @task-title: ファイル全走査方式。パラメータ: `query`（大文字小文字非区別部分文字列検索
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/grid_search_design.md, docs/detailed_design/component_architecture.md
// @generated-by: codd implement --sprint 22

import { invoke } from '@tauri-apps/api/core';
import type { NoteMetadata, SearchParams } from './types';

/**
 * Invoke the Rust `search_notes` command.
 *
 * - query: case-insensitive substring match against note body only
 * - tags:  AND-condition exact match against frontmatter tags
 * - date_from / date_to: inclusive range filter derived from filename timestamp
 *
 * Performance target: < 100 ms for the default window of the last 7 days (dozens of notes).
 */
export async function searchNotes(params: SearchParams): Promise<NoteMetadata[]> {
  const { query, tags, date_from, date_to } = params;

  const result = await invoke<NoteMetadata[]>('search_notes', {
    query: query && query.length > 0 ? query : null,
    tags: tags && tags.length > 0 ? tags : null,
    date_from: date_from ?? null,
    date_to: date_to ?? null,
  });

  return result;
}

/**
 * Build the default SearchParams for the last 7 days (inclusive of today).
 */
export function buildDefaultSearchParams(): SearchParams {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 7);

  return {
    query: '',
    tags: [],
    date_from: from.toISOString().slice(0, 10),
    date_to: now.toISOString().slice(0, 10),
  };
}
