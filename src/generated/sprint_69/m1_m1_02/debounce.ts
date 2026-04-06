// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 69-1
// @task-title: M1（M1-02）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:69 task:69-1 module:m1_m1_02
// CoDD trace: detail:editor_clipboard §4.5, detail:component_architecture §4.2
// Shared utility: debounce function for auto-save (module:editor, 500ms)
// and search input (module:grid, 300ms)

/**
 * Creates a debounced version of the given async or sync function.
 * Uses setTimeout/clearTimeout as specified in design docs.
 *
 * Primary consumers:
 *   - module:editor auto-save: 500ms debounce on EditorView.updateListener docChanged
 *   - module:grid search: 300ms debounce on search text input
 *
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds. Resets on each call.
 * @returns Object with `call` (debounced invoker) and `flush` (immediate execution + cancel)
 */
export function createDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delayMs: number
): {
  /** Invoke the function after the debounce delay. Resets timer if called again. */
  call: (...args: TArgs) => void;
  /** Immediately execute pending call (if any) and cancel the timer. */
  flush: () => void;
  /** Cancel any pending call without executing. */
  cancel: () => void;
  /** Whether there is a pending debounced call. */
  readonly pending: boolean;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: TArgs | null = null;

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingArgs = null;
  }

  function flush(): void {
    if (timeoutId !== null && pendingArgs !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  }

  function call(...args: TArgs): void {
    cancel();
    pendingArgs = args;
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const a = pendingArgs;
      pendingArgs = null;
      if (a !== null) {
        fn(...a);
      }
    }, delayMs);
  }

  return {
    call,
    flush,
    cancel,
    get pending() {
      return timeoutId !== null;
    },
  };
}

/** Auto-save debounce interval (ms). Design spec: 500ms. See OQ-004 for possible adjustment. */
export const AUTOSAVE_DEBOUNCE_MS = 500;

/** Search input debounce interval (ms). Design spec: 300ms. See OQ-GRID-001 for possible adjustment. */
export const SEARCH_DEBOUNCE_MS = 300;
