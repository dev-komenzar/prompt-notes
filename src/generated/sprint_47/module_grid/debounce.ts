// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// Generic debounce utility shared with module:editor (auto-save).

export interface DebouncedFn<A extends unknown[]> {
  (...args: A): void;
  /** Cancel any pending invocation. */
  cancel(): void;
  /** If a call is pending, execute it immediately and clear the timer. */
  flush(): void;
}

/**
 * Returns a debounced wrapper around `fn`.
 *
 * While the wrapper is called repeatedly within `delayMs`, execution
 * is deferred.  Only the latest arguments are retained; earlier calls
 * are silently discarded.
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): DebouncedFn<A> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: A | null = null;

  function invoke(): void {
    const args = pendingArgs;
    pendingArgs = null;
    timerId = null;
    if (args !== null) {
      fn(...args);
    }
  }

  const debounced = (...args: A): void => {
    pendingArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(invoke, delayMs);
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    pendingArgs = null;
  };

  debounced.flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      invoke();
    }
  };

  return debounced;
}
