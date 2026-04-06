// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: `module:storage`, `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:53 task:53-1 module:storage,grid milestone:パフォーマンス計測

/**
 * Debounce utility shared by module:editor (auto-save, 500ms) and
 * module:grid (search input, 300ms).
 *
 * Reference:
 *   - editor_clipboard_design.md §4.5: auto-save debounce 500ms
 *   - grid_search_design.md §4.2: search debounce 300ms
 */

/**
 * Create a debounced version of a function.
 *
 * The debounced function delays invoking the provided function until
 * after `delayMs` milliseconds have elapsed since the last invocation.
 *
 * @param fn - The function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Object with the debounced callable, cancel, and flush methods
 */
export function createDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delayMs: number,
): {
  /** Call the debounced function. Resets timer on each call. */
  call: (...args: TArgs) => void;
  /** Cancel any pending invocation. */
  cancel: () => void;
  /** Immediately invoke with the last-provided args if a call is pending. */
  flush: () => void;
  /** Whether there is a pending invocation. */
  readonly isPending: boolean;
} {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: TArgs | null = null;

  function cancel(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    lastArgs = null;
  }

  function flush(): void {
    if (timerId !== null && lastArgs !== null) {
      clearTimeout(timerId);
      timerId = null;
      const args = lastArgs;
      lastArgs = null;
      fn(...args);
    }
  }

  function call(...args: TArgs): void {
    lastArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const a = lastArgs;
      lastArgs = null;
      if (a !== null) {
        fn(...a);
      }
    }, delayMs);
  }

  return {
    call,
    cancel,
    flush,
    get isPending() {
      return timerId !== null;
    },
  };
}
