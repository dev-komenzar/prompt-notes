// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Debounce utility

/**
 * Creates a debounced version of the provided function.
 * Subsequent calls within the delay window reset the timer.
 *
 * Used for search input debouncing (SEARCH_DEBOUNCE_MS = 300ms)
 * in module:grid. Also reusable by module:editor for auto-save.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  function debounced(...args: Args): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = undefined;
      fn(...args);
    }, delayMs);
  }

  return debounced;
}

/**
 * Creates a debounced async function. Returns a cancel handle.
 * Useful when the caller needs to flush or cancel pending invocations.
 */
export function debounceCancellable<Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  delayMs: number,
): { call: (...args: Args) => void; cancel: () => void; flush: (...args: Args) => void } {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let latestArgs: Args | undefined;

  function cancel(): void {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  }

  function call(...args: Args): void {
    latestArgs = args;
    cancel();
    timerId = setTimeout(() => {
      timerId = undefined;
      fn(...args);
    }, delayMs);
  }

  function flush(...args: Args): void {
    cancel();
    const resolvedArgs = args.length > 0 ? args : latestArgs;
    if (resolvedArgs !== undefined) {
      fn(...resolvedArgs);
    }
  }

  return { call, cancel, flush };
}
