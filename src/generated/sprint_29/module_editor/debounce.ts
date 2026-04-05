// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// CoDD trace: detail:editor_clipboard §4.5, detail:component_architecture §4.2
// Auto-save debounce: 500ms (CONV-AUTOSAVE). Shared utility also used by
// module:grid search debounce.

export interface DebouncedFn<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  /** Immediately execute the pending invocation if one exists. */
  flush(): void;
  /** Cancel the pending invocation without executing it. */
  cancel(): void;
  /** Returns true when a debounced call is pending. */
  pending(): boolean;
}

export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delayMs: number,
): DebouncedFn<T> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const invoke = (): void => {
    if (latestArgs !== null) {
      const args = latestArgs;
      latestArgs = null;
      fn(...args);
    }
  };

  const debounced = ((...args: Parameters<T>): void => {
    latestArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      invoke();
    }, delayMs);
  }) as DebouncedFn<T>;

  debounced.flush = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    invoke();
  };

  debounced.cancel = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    latestArgs = null;
  };

  debounced.pending = (): boolean => timerId !== null;

  return debounced;
}
