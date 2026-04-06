// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: `module:grid`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:51 | task:51-1 | module:grid, module:settings
// Generic debounce utility. Used for search input (300ms) and auto-save (500ms).

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function debounced(...args: Args): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delayMs);
  }

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export function flushableDebounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): {
  call: (...args: Args) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  function call(...args: Args): void {
    pendingArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const args = pendingArgs;
      pendingArgs = null;
      if (args !== null) {
        fn(...args);
      }
    }, delayMs);
  }

  function flush(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingArgs !== null) {
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  }

  return { call, flush, cancel };
}
