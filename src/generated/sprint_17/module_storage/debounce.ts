// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 17-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Debounce utility
// Used by module:editor for auto-save (500ms) and module:grid for search (300ms).
// Provides cancel() and flush() for lifecycle management:
//   - flush() on note switch or app close to persist pending changes
//   - cancel() when discarding pending operations

export interface DebouncedFn<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): void;
  /** Cancels any pending invocation without executing it. */
  cancel(): void;
  /** Immediately executes the pending invocation if one exists. */
  flush(): void;
}

/**
 * Creates a debounced version of the given function.
 * The function is invoked after `delayMs` milliseconds of inactivity.
 * Each new call resets the timer.
 */
export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delayMs: number,
): DebouncedFn<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  const execute = (): void => {
    const args = pendingArgs;
    timeoutId = null;
    pendingArgs = null;
    if (args !== null) {
      fn(...args);
    }
  };

  const debounced = ((...args: Parameters<T>): void => {
    pendingArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(execute, delayMs);
  }) as DebouncedFn<T>;

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  };

  debounced.flush = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      execute();
    }
  };

  return debounced;
}
