// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 19-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=19, task=19-1, module=storage, node=detail:editor_clipboard
// Debounce utility for auto-save (500ms) and search input (300ms).
// Used by module:editor (auto-save) and module:grid (search debounce).

export interface DebouncedFn<T extends (...args: unknown[]) => unknown> {
  /** Call the debounced function; resets timer on each call */
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation */
  cancel(): void;
  /** Immediately invoke if a call is pending, then cancel timer */
  flush(): void;
}

/**
 * Creates a debounced version of the given function.
 * The function will be invoked after `delayMs` milliseconds of inactivity.
 *
 * Auto-save: 500ms debounce (CONV-AUTOSAVE, OQ-004)
 * Search input: 300ms debounce (OQ-GRID-001)
 *
 * @param fn - The function to debounce
 * @param delayMs - Delay in milliseconds
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number,
): DebouncedFn<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const argsToUse = latestArgs;
      latestArgs = null;
      if (argsToUse !== null) {
        fn(...argsToUse);
      }
    }, delayMs);
  }) as DebouncedFn<T>;

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  debounced.flush = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (latestArgs !== null) {
      const argsToUse = latestArgs;
      latestArgs = null;
      fn(...argsToUse);
    }
  };

  return debounced;
}

/** Default debounce delay for auto-save (module:editor) */
export const AUTO_SAVE_DEBOUNCE_MS = 500;

/** Default debounce delay for search input (module:grid) */
export const SEARCH_DEBOUNCE_MS = 300;
