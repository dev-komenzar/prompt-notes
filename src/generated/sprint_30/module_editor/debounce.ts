// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:editor_clipboard
// Generic debounce utility. Used by auto-save (500ms) and search (300ms).
// Supports flush (immediate execution of pending call) and cancel.

export interface DebouncedFn<T extends (...args: never[]) => unknown> {
  (...args: Parameters<T>): void;
  flush(): void;
  cancel(): void;
  pending(): boolean;
}

export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number,
): DebouncedFn<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>): void => {
    lastArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const captured = lastArgs;
      lastArgs = null;
      if (captured !== null) {
        fn(...captured);
      }
    }, delay);
  }) as DebouncedFn<T>;

  debounced.flush = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs !== null) {
      const captured = lastArgs;
      lastArgs = null;
      fn(...captured);
    }
  };

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.pending = (): boolean => {
    return timeoutId !== null;
  };

  return debounced;
}
