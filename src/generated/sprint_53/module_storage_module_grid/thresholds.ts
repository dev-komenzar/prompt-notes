// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: `module:storage`, `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:53 task:53-1 module:storage,grid milestone:パフォーマンス計測

import type { PerfThreshold, OperationName, PerfModule } from './types';

/**
 * Performance thresholds derived from design documents:
 * - docs/detailed_design/storage_fileformat_design.md §4.8
 * - docs/detailed_design/grid_search_design.md §4.7
 *
 * These are release-blocking thresholds. Operations exceeding these
 * limits indicate a performance regression that must be resolved
 * before release.
 */

export const STORAGE_THRESHOLDS: ReadonlyArray<PerfThreshold> = [
  {
    operation: 'create_note',
    module: 'storage',
    maxDurationMs: 1,
    condition: 'File creation + timestamp generation',
    designRef: 'storage_fileformat_design.md §4.8',
  },
  {
    operation: 'save_note',
    module: 'storage',
    maxDurationMs: 1,
    condition: 'std::fs::write to local file system',
    designRef: 'storage_fileformat_design.md §4.8',
  },
  {
    operation: 'read_note',
    module: 'storage',
    maxDurationMs: 1,
    condition: 'std::fs::read_to_string from local file system',
    designRef: 'storage_fileformat_design.md §4.8',
  },
  {
    operation: 'list_notes',
    module: 'storage',
    maxDurationMs: 100,
    condition: '1,000 note files scan + frontmatter parse',
    designRef: 'storage_fileformat_design.md §4.8',
  },
  {
    operation: 'search_notes',
    module: 'storage',
    maxDurationMs: 200,
    condition: '1,000 note files full-text scan',
    designRef: 'storage_fileformat_design.md §4.8',
  },
] as const;

export const GRID_THRESHOLDS: ReadonlyArray<PerfThreshold> = [
  {
    operation: 'initial_load',
    module: 'grid',
    maxDurationMs: 100,
    condition: '7-day default filter list_notes + Masonry render (dozens of notes)',
    designRef: 'grid_search_design.md §4.7',
  },
  {
    operation: 'tag_filter',
    module: 'grid',
    maxDurationMs: 100,
    condition: '1,000 notes tag filter + re-render',
    designRef: 'grid_search_design.md §4.7',
  },
  {
    operation: 'date_filter',
    module: 'grid',
    maxDurationMs: 100,
    condition: '1,000 notes date range filter + re-render',
    designRef: 'grid_search_design.md §4.7',
  },
  {
    operation: 'fulltext_search',
    module: 'grid',
    maxDurationMs: 200,
    condition: '1,000 notes full-text scan + re-render',
    designRef: 'grid_search_design.md §4.7',
  },
  {
    operation: 'card_click_transition',
    module: 'grid',
    maxDurationMs: 50,
    condition: 'currentView switch + read_note IPC + CodeMirror load',
    designRef: 'grid_search_design.md §4.7',
  },
  {
    operation: 'masonry_render',
    module: 'grid',
    maxDurationMs: 50,
    condition: 'CSS Columns / Masonry layout computation for up to 100 cards',
    designRef: 'grid_search_design.md §4.3',
  },
] as const;

/**
 * All thresholds combined.
 */
export const ALL_THRESHOLDS: ReadonlyArray<PerfThreshold> = [
  ...STORAGE_THRESHOLDS,
  ...GRID_THRESHOLDS,
] as const;

/**
 * Retrieve the threshold for a given operation and module.
 * Returns undefined if no threshold is defined.
 */
export function getThreshold(
  operation: OperationName,
  module: PerfModule,
): PerfThreshold | undefined {
  return ALL_THRESHOLDS.find(
    (t) => t.operation === operation && t.module === module,
  );
}

/**
 * Note count at which full-text search performance should be
 * re-evaluated and tantivy indexing engine considered.
 * Reference: storage_fileformat_design.md §4.3, grid_search_design.md §4.7
 */
export const TANTIVY_CONSIDERATION_THRESHOLD = 5000;

/**
 * Search debounce interval in ms.
 * Reference: grid_search_design.md §4.2
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Auto-save debounce interval in ms.
 * Reference: editor_clipboard_design.md §4.5
 */
export const AUTOSAVE_DEBOUNCE_MS = 500;
