// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// design-ref: detail:component_architecture §3.4, detail:grid_search §4.2

/**
 * Generic debounce utility shared by module:grid (search input, 300 ms)
 * and module:editor (auto-save, 500 ms).
 *
 * Returns a debounced version of `fn` together with a `flush` handle
 * that forces immediate execution of any pending invocation and a
 * `cancel` handle that discards a pending invocation without executing.
 */
export interface Debounced<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): void;
  flush(): void;
  cancel(): void;
}

export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delayMs: number,
): Debounced<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const captured = latestArgs;
      latestArgs = null;
      if (captured !== null) {
        fn(...captured);
      }
    }, delayMs);
  }) as Debounced<T>;

  debounced.flush = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    const captured = latestArgs;
    latestArgs = null;
    if (captured !== null) {
      fn(...captured);
    }
  };

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  return debounced;
}
