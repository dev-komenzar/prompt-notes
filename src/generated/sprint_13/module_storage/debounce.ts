// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Generic debounce utility using setTimeout / clearTimeout.
// Primary consumers:
//   module:editor — auto-save (500 ms)
//   module:grid   — search input (300 ms)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export interface DebouncedFunction<T extends AnyFunction> {
  /** Schedule (or reschedule) the debounced invocation. */
  (...args: Parameters<T>): void;
  /** Cancel a pending invocation without executing it. */
  cancel(): void;
  /**
   * If an invocation is pending, execute it immediately and clear the timer.
   * Returns the function's return value (possibly a Promise) or undefined
   * if nothing was pending.
   */
  flush(): ReturnType<T> | undefined;
  /** Whether a debounced invocation is currently pending. */
  readonly pending: boolean;
}

export function debounce<T extends AnyFunction>(
  fn: T,
  delayMs: number,
): DebouncedFunction<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>): void => {
    lastArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const captured = lastArgs;
      lastArgs = null;
      if (captured !== null) {
        fn(...captured);
      }
    }, delayMs);
  }) as DebouncedFunction<T>;

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    lastArgs = null;
  };

  debounced.flush = (): ReturnType<T> | undefined => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (lastArgs !== null) {
      const captured = lastArgs;
      lastArgs = null;
      return fn(...captured) as ReturnType<T>;
    }
    return undefined;
  };

  Object.defineProperty(debounced, 'pending', {
    get: (): boolean => timerId !== null,
    enumerable: true,
  });

  return debounced;
}
