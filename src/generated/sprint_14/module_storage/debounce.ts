// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:14 task:14-1 module:storage
// Debounce utility — used by module:editor (auto-save 500ms) and
// module:grid (search input 300ms).

/**
 * A debounced function with explicit flush and cancel capabilities.
 */
export interface Debounced<TArgs extends unknown[]> {
  /** Invoke the debounced function. Resets the timer on each call. */
  (...args: TArgs): void;
  /** Immediately execute the pending callback (if any) and clear the timer. */
  flush(): void;
  /** Cancel any pending invocation without executing. */
  cancel(): void;
  /** Returns true if a callback invocation is pending. */
  pending(): boolean;
}

/**
 * Creates a debounced version of the provided function.
 *
 * The returned function delays invocation of `fn` until `delayMs` milliseconds
 * have elapsed since the last call. Subsequent calls within the delay window
 * reset the timer. The most recent arguments are preserved.
 *
 * flush() is critical for:
 *  - Flushing unsaved changes before note switch
 *  - Flushing on component destroy (onDestroy)
 *  - Flushing on window close (Tauri close-requested event)
 *
 * @param fn       - The function to debounce.
 * @param delayMs  - Delay in milliseconds.
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delayMs: number
): Debounced<TArgs> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: TArgs | null = null;

  function execute(): void {
    if (latestArgs !== null) {
      const args = latestArgs;
      latestArgs = null;
      timerId = null;
      fn(...args);
    }
  }

  const debounced = ((...args: TArgs): void => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(execute, delayMs);
  }) as Debounced<TArgs>;

  debounced.flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    execute();
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  debounced.pending = (): boolean => {
    return timerId !== null;
  };

  return debounced;
}
