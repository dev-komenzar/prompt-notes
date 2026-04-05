// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 46-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=46 task=46-1 node=detail:editor_clipboard,detail:grid_search
// Generic debounce utility used by:
//   - module:editor  auto-save (500ms)
//   - module:grid    search input (300ms)

export interface DebouncedFn<T extends (...args: unknown[]) => unknown> {
  /** Invoke the debounced function. Resets the timer on each call. */
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation. */
  cancel(): void;
  /** If a call is pending, execute it immediately and clear the timer. */
  flush(): void;
}

/**
 * Creates a debounced version of `fn` that delays invocation until `delayMs`
 * milliseconds have elapsed since the last call. Each new call resets the timer.
 *
 * @param fn       The function to debounce.
 * @param delayMs  Delay in milliseconds (e.g. 500 for auto-save, 300 for search).
 * @returns        A debounced wrapper with .cancel() and .flush() helpers.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number,
): DebouncedFn<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const invoke = () => {
    if (latestArgs !== null) {
      const args = latestArgs;
      latestArgs = null;
      timerId = null;
      fn(...args);
    }
  };

  const debounced = ((...args: Parameters<T>) => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(invoke, delayMs);
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
      invoke();
    }
  };

  return debounced;
}
