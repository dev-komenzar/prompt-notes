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

// CoDD Traceability: sprint:53 task:53-1 module:grid milestone:パフォーマンス計測

/**
 * Performance measurement utilities for module:grid operations.
 *
 * These measure frontend-side grid operations including:
 * - Initial load with default 7-day filter (CONV-GRID-1)
 * - Tag filter application (CONV-GRID-2)
 * - Date filter change (CONV-GRID-2)
 * - Full-text search (CONV-GRID-2)
 * - Card click → editor transition (CONV-GRID-3)
 * - Masonry layout rendering (CONV-GRID-1)
 *
 * Convention compliance:
 *   - All data fetches go through IPC (no direct FS access)
 *   - No client-side search logic (all search is Rust-side)
 *   - Pinterest-style variable-height cards required
 *   - Default filter: last 7 days
 */

import type { NoteEntry, GridOperation, PerfSample } from './types';
import { PerfTracker } from './perf_tracker';
import { daysAgoDateString, todayDateString, now } from './perf_utils';
import type { StoragePerfApi, ListNotesArgs, SearchNotesArgs } from './storage_perf';

/**
 * Filter state maintained by the grid view.
 */
export interface GridFilterState {
  fromDate: string;
  toDate: string;
  tag?: string;
  query: string;
}

/**
 * Create the default 7-day filter state.
 * Reference: grid_search_design.md §4.1 — CONV-GRID-1
 */
export function createDefaultFilterState(): GridFilterState {
  return {
    fromDate: daysAgoDateString(7),
    toDate: todayDateString(),
    tag: undefined,
    query: '',
  };
}

/**
 * Performance-instrumented grid data operations.
 *
 * Wraps storage IPC calls with grid-specific performance tracking
 * that measures the full round-trip from frontend request to data
 * availability (before render).
 *
 * @param storageApi - The instrumented storage API
 */
export function createGridPerfApi(storageApi: StoragePerfApi) {
  const tracker = PerfTracker.getInstance();

  /**
   * Perform the initial grid load with default 7-day filter.
   * Measures: IPC list_notes call with default date range.
   */
  async function initialLoad(): Promise<{ notes: NoteEntry[]; sample: PerfSample }> {
    const defaultFilter = createDefaultFilterState();
    const { result, sample } = await tracker.measureAsync(
      'grid',
      'initial_load',
      () =>
        storageApi.listNotes({
          from_date: defaultFilter.fromDate,
          to_date: defaultFilter.toDate,
        }),
      {
        fromDate: defaultFilter.fromDate,
        toDate: defaultFilter.toDate,
      },
    );
    return { notes: result, sample };
  }

  /**
   * Apply a tag filter. Calls list_notes with current date range + tag.
   */
  async function applyTagFilter(
    filterState: GridFilterState,
    tag: string,
  ): Promise<{ notes: NoteEntry[]; sample: PerfSample }> {
    const args: ListNotesArgs = {
      from_date: filterState.fromDate,
      to_date: filterState.toDate,
      tag,
    };
    const { result, sample } = await tracker.measureAsync(
      'grid',
      'tag_filter',
      () => storageApi.listNotes(args),
      { tag },
    );
    return { notes: result, sample };
  }

  /**
   * Apply a date filter. Calls list_notes with new date range + optional tag.
   */
  async function applyDateFilter(
    fromDate: string,
    toDate: string,
    tag?: string,
  ): Promise<{ notes: NoteEntry[]; sample: PerfSample }> {
    const args: ListNotesArgs = {
      from_date: fromDate,
      to_date: toDate,
      tag,
    };
    const { result, sample } = await tracker.measureAsync(
      'grid',
      'date_filter',
      () => storageApi.listNotes(args),
      { fromDate, toDate, hasTag: tag !== undefined },
    );
    return { notes: result, sample };
  }

  /**
   * Perform full-text search. Uses search_notes IPC (Rust file-scan).
   * No client-side search is performed — CONV-GRID-2 compliance.
   */
  async function fulltextSearch(
    filterState: GridFilterState,
    query: string,
  ): Promise<{ notes: NoteEntry[]; sample: PerfSample }> {
    const args: SearchNotesArgs = {
      query,
      from_date: filterState.fromDate,
      to_date: filterState.toDate,
      tag: filterState.tag,
    };
    const { result, sample } = await tracker.measureAsync(
      'grid',
      'fulltext_search',
      () => storageApi.searchNotes(args),
      { queryLength: query.length },
    );
    return { notes: result, sample };
  }

  /**
   * Measure the card click → editor transition time.
   * This measures from click event to read_note IPC completion.
   * The actual CodeMirror mount is measured separately by module:editor.
   */
  async function measureCardClickTransition(
    filename: string,
  ): Promise<{ content: string; sample: PerfSample }> {
    const { result, sample } = await tracker.measureAsync(
      'grid',
      'card_click_transition',
      () => storageApi.readNote(filename),
      { filename },
    );
    return { content: result.content, sample };
  }

  return {
    initialLoad,
    applyTagFilter,
    applyDateFilter,
    fulltextSearch,
    measureCardClickTransition,
  } as const;
}

/**
 * Type of the instrumented grid API.
 */
export type GridPerfApi = ReturnType<typeof createGridPerfApi>;

/**
 * Measure a synchronous Masonry layout render cycle.
 *
 * Call this around the actual DOM layout/render of the Masonry grid.
 * Uses requestAnimationFrame to capture the full render cycle.
 *
 * @param noteCount - Number of note cards being rendered
 * @returns Promise that resolves with the measurement sample after render
 */
export function measureMasonryRender(noteCount: number): Promise<PerfSample> {
  const tracker = PerfTracker.getInstance();
  const startTime = now();

  return new Promise<PerfSample>((resolve) => {
    // Use double-rAF to capture after the browser has painted
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const endTime = now();
        const durationMs = endTime - startTime;

        const sample: PerfSample = {
          id: `grid:masonry_render:${Date.now()}`,
          module: 'grid',
          operation: 'masonry_render',
          startTime,
          durationMs,
          timestamp: new Date().toISOString(),
          success: true,
          metadata: { noteCount },
        };

        tracker.recordSample(sample);
        resolve(sample);
      });
    });
  });
}

/**
 * Determine whether the IPC command should be list_notes or search_notes
 * based on the current filter state.
 *
 * Rule from grid_search_design.md §2.3 state machine:
 *   query === '' → list_notes
 *   query !== '' → search_notes
 */
export function shouldUseSearchCommand(filterState: GridFilterState): boolean {
  return filterState.query.trim().length > 0;
}
