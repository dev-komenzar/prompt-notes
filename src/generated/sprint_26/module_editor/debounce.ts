// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 26-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:26 | task:26-1 | module:editor
// Generic debounce utility with flush/cancel support.
// Used by module:editor for 500ms auto-save and reusable by module:grid for search.

export type DebouncedFunction<TArgs extends unknown[]> = {
  (...args: TArgs): void;
  /** Immediately invoke the pending callback (if any) and clear the timer. */
  flush(): void;
  /** Cancel the pending invocation without executing. */
  cancel(): void;
  /** Whether a deferred invocation is currently pending. */
  readonly pending: boolean;
};

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): DebouncedFunction<TArgs> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: TArgs | null = null;

  const debounced = ((...args: TArgs): void => {
    latestArgs = args;
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      if (latestArgs !== null) {
        const captured = latestArgs;
        latestArgs = null;
        fn(...captured);
      }
    }, delayMs);
  }) as DebouncedFunction<TArgs>;

  debounced.flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (latestArgs !== null) {
      const captured = latestArgs;
      latestArgs = null;
      fn(...captured);
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
    get: () => timerId !== null,
    enumerable: true,
  });

  return debounced;
}
