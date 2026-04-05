// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:grid_search §2.1, §2.3, §4.1–§4.5

import type {
  NoteEntry,
  FilterCriteria,
  GridSnapshot,
  GridViewState,
  LoadingStatus,
} from './types';
import {
  createDefaultFilterCriteria,
  resolveQuery,
  deriveViewState,
  applyTagChange,
  applyDateChange,
  applyQueryChange,
  clearSearch,
  resetFilters,
} from './filter_state';
import { getDefault7DayRange } from './date_utils';
import { listNotes, searchNotes } from './api';
import { debounce } from './debounce';
import { SEARCH_DEBOUNCE_MS } from './constants';

/**
 * Callback type for snapshot subscribers.
 */
export type SnapshotListener = (snapshot: GridSnapshot) => void;

/**
 * GridController orchestrates the filter + search combination behaviour
 * for module:grid.
 *
 * It is designed to be instantiated once per GridView.svelte lifecycle
 * (onMount → new GridController(), onDestroy → controller.destroy()).
 *
 * Svelte components interact with it via methods (setTag, setDateRange,
 * setQuery, …) and receive state updates through the subscribe callback.
 *
 * IMPORTANT CONSTRAINTS:
 *   - All data fetching goes through api.ts → Tauri IPC → module:storage.
 *   - No client-side filtering/searching (CONV-IPC, detail:grid_search §4.5).
 *   - module:grid never calls read_note; card-click transitions are
 *     handled by setting App.svelte's currentView (§4.4).
 */
export class GridController {
  private criteria: FilterCriteria;
  private notes: NoteEntry[] = [];
  private loadingStatus: LoadingStatus = 'idle';
  private error: string | null = null;
  private listeners: Set<SnapshotListener> = new Set();

  /** Cached default range for deriveViewState comparison. */
  private readonly defaultFromDate: string;
  private readonly defaultToDate: string;

  /** Debounced search handler (300 ms, detail:grid_search §4.2). */
  private readonly debouncedSearch: ReturnType<typeof debounce<(q: string) => void>>;

  /** Monotonic fetch counter to discard stale responses. */
  private fetchGeneration = 0;

  constructor() {
    const defaultRange = getDefault7DayRange();
    this.defaultFromDate = defaultRange.fromDate;
    this.defaultToDate = defaultRange.toDate;
    this.criteria = createDefaultFilterCriteria();

    this.debouncedSearch = debounce((query: string) => {
      this.criteria = applyQueryChange(this.criteria, query);
      void this.fetchNotes();
    }, SEARCH_DEBOUNCE_MS);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  /**
   * Initialize the controller: fetch the default 7-day view.
   * Should be called from GridView.svelte onMount.
   */
  async init(): Promise<void> {
    await this.fetchNotes();
  }

  /**
   * Tear down: cancel pending debounce timers.
   * Should be called from GridView.svelte onDestroy.
   */
  destroy(): void {
    this.debouncedSearch.cancel();
    this.listeners.clear();
  }

  // ── Subscription ───────────────────────────────────────────────────

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    // Immediately push current state to the new subscriber.
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── User Actions ───────────────────────────────────────────────────

  /**
   * Called by TagFilter.svelte when user selects or clears a tag.
   */
  async setTag(tag: string | null): Promise<void> {
    this.criteria = applyTagChange(this.criteria, tag);
    await this.fetchNotes();
  }

  /**
   * Called by DateFilter.svelte when user changes the date range.
   */
  async setDateRange(fromDate: string, toDate: string): Promise<void> {
    this.criteria = applyDateChange(this.criteria, fromDate, toDate);
    await this.fetchNotes();
  }

  /**
   * Called by the search text box on every input event.
   * Debounced at 300 ms (SEARCH_DEBOUNCE_MS).
   *
   * When the query becomes empty, we immediately switch back to list_notes
   * (no debounce needed for clearing).
   */
  setQuery(query: string): void {
    if (query.length === 0 && this.criteria.query.length > 0) {
      this.debouncedSearch.cancel();
      this.criteria = clearSearch(this.criteria);
      void this.fetchNotes();
      return;
    }
    this.debouncedSearch(query);
  }

  /**
   * Reset all filters and search to the 7-day default.
   */
  async resetAll(): Promise<void> {
    this.debouncedSearch.cancel();
    this.criteria = resetFilters();
    await this.fetchNotes();
  }

  /**
   * Delete a note and refresh the grid.
   */
  async deleteNote(filename: string): Promise<void> {
    const { deleteNote: deleteNoteApi } = await import('./api');
    await deleteNoteApi({ filename });
    await this.fetchNotes();
  }

  // ── Read-only Accessors ────────────────────────────────────────────

  /** Current filter criteria (for display in filter UI components). */
  getFilterCriteria(): Readonly<FilterCriteria> {
    return this.criteria;
  }

  /** Current grid view state enum. */
  getViewState(): GridViewState {
    return deriveViewState(this.criteria, this.defaultFromDate, this.defaultToDate);
  }

  // ── Private ────────────────────────────────────────────────────────

  /**
   * Core data-fetch routine.
   *
   * Resolves the current FilterCriteria into either a list_notes or
   * search_notes IPC call (detail:grid_search §2.3 state machine).
   */
  private async fetchNotes(): Promise<void> {
    const generation = ++this.fetchGeneration;
    this.loadingStatus = 'loading';
    this.error = null;
    this.emit();

    try {
      const resolved = resolveQuery(this.criteria);
      let result: NoteEntry[];

      if (resolved.command === 'search_notes') {
        result = await searchNotes(resolved.params);
      } else {
        result = await listNotes(resolved.params);
      }

      // Discard stale responses – a newer fetch may already be in flight.
      if (generation !== this.fetchGeneration) return;

      this.notes = result;
      this.loadingStatus = 'loaded';
      this.error = null;
    } catch (err: unknown) {
      if (generation !== this.fetchGeneration) return;

      this.notes = [];
      this.loadingStatus = 'error';
      this.error = err instanceof Error ? err.message : String(err);
    }

    this.emit();
  }

  private snapshot(): GridSnapshot {
    return {
      notes: this.notes,
      filterCriteria: { ...this.criteria },
      viewState: deriveViewState(
        this.criteria,
        this.defaultFromDate,
        this.defaultToDate,
      ),
      loadingStatus: this.loadingStatus,
      error: this.error,
    };
  }

  private emit(): void {
    const snap = this.snapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }
}
