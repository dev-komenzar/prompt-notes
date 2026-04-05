// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 27 – module:editor – Debounce utility
// Used by autosave (500ms) and potentially search input.
// Provides flush() for lifecycle cleanup (onDestroy, window close)
// and cancel() for teardown.

export interface DebouncedFn<TArgs extends unknown[]> {
  (...args: TArgs): void;
  /** Immediately execute with most recent args if a call is pending. */
  flush(): void;
  /** Cancel any pending invocation without executing. */
  cancel(): void;
  /** Whether a call is currently pending. */
  readonly pending: boolean;
}

export function createDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => unknown,
  delay: number,
): DebouncedFn<TArgs> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: TArgs | null = null;

  const debounced = (...args: TArgs): void => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const args = latestArgs;
      latestArgs = null;
      if (args !== null) {
        fn(...args);
      }
    }, delay);
  };

  debounced.flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (latestArgs !== null) {
      const args = latestArgs;
      latestArgs = null;
      fn(...args);
    }
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  Object.defineProperty(debounced, 'pending', {
    get(): boolean {
      return timerId !== null;
    },
    enumerable: true,
  });

  return debounced as DebouncedFn<TArgs>;
}
