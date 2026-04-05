// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:18 task:18-1 module:storage
// Generic debounce utility used by module:editor (auto-save, 500ms)
// and module:grid (search input, 300ms).

export interface DebouncedFn<T extends (...args: unknown[]) => unknown> {
  /** Call the debounced function. Resets the timer on each invocation. */
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation. */
  cancel(): void;
  /** Immediately execute if a call is pending, then cancel the timer. */
  flush(): void;
}

/**
 * Creates a debounced version of the given function.
 * The function is invoked after `delayMs` milliseconds of inactivity.
 *
 * @param fn - The function to debounce.
 * @param delayMs - Delay in milliseconds.
 * @returns A debounced wrapper with cancel() and flush() methods.
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
      fn(...args);
    }
  };

  const debounced = ((...args: Parameters<T>) => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      invoke();
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
    invoke();
  };

  return debounced;
}
