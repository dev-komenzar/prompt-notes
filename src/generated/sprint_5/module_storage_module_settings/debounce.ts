// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 5-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=5, task=5-1, modules=[storage,settings]

/**
 * Creates a debounced version of the provided async or sync function.
 * Used by module:editor for auto-save (500ms) and module:grid for search (300ms).
 *
 * When the debounced function is called, it resets the internal timer.
 * The underlying function executes only after the specified delay
 * has elapsed without another invocation.
 *
 * @param fn - The function to debounce.
 * @param delayMs - Delay in milliseconds before fn is invoked.
 * @returns An object with `call` to invoke the debounced function,
 *          `flush` to execute immediately if pending,
 *          and `cancel` to discard pending execution.
 */
export function createDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => unknown,
  delayMs: number,
): DebouncedFn<TArgs> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: TArgs | null = null;

  function cancel(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    pendingArgs = null;
  }

  function flush(): void {
    if (timerId !== null && pendingArgs !== null) {
      clearTimeout(timerId);
      timerId = null;
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  }

  function call(...args: TArgs): void {
    pendingArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const invokeArgs = pendingArgs;
      pendingArgs = null;
      if (invokeArgs !== null) {
        fn(...invokeArgs);
      }
    }, delayMs);
  }

  function isPending(): boolean {
    return timerId !== null;
  }

  return { call, flush, cancel, isPending };
}

export interface DebouncedFn<TArgs extends unknown[]> {
  /** Invoke the debounced function. Resets the timer on each call. */
  call: (...args: TArgs) => void;
  /** If a call is pending, execute it immediately and clear the timer. */
  flush: () => void;
  /** Cancel any pending invocation without executing. */
  cancel: () => void;
  /** Returns true if there is a pending invocation. */
  isPending: () => boolean;
}
