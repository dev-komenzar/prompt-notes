// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage,settings]
// Shared debounce utility.
// Primary consumers: module:editor auto-save (500ms), module:grid search (300ms).

export type DebouncedFn<T extends (...args: unknown[]) => unknown> = {
  /** Invoke the debounced function. Resets the timer on each call. */
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation. */
  cancel(): void;
  /** Immediately invoke if a call is pending, then cancel the timer. */
  flush(): void;
};

/**
 * Returns a debounced wrapper around `fn`.
 *
 * @param fn    The function to debounce.
 * @param delayMs  Delay in milliseconds (e.g. 500 for auto-save, 300 for search).
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number,
): DebouncedFn<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const invoke = (): void => {
    if (latestArgs !== null) {
      const args = latestArgs;
      latestArgs = null;
      timerId = null;
      fn(...args);
    }
  };

  const debounced = ((...args: Parameters<T>): void => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(invoke, delayMs);
  }) as DebouncedFn<T>;

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  debounced.flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
      invoke();
    }
  };

  return debounced;
}
