// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — Generic debounce utility (OQ-004 core primitive).
//
// Provides call / flush / cancel / isPending semantics required by auto-save:
//   • call()      — (re)starts the delay timer with the latest arguments.
//   • flush()     — immediately executes a pending invocation if one exists.
//   • cancel()    — discards a pending invocation without executing it.
//   • isPending() — returns whether an invocation is currently scheduled.

export interface DebouncedHandle<TArgs extends unknown[]> {
  /** Schedule a debounced invocation. Resets the timer on repeated calls. */
  call(...args: TArgs): void;
  /** Execute the pending invocation immediately. No-op if nothing is pending. */
  flush(): void;
  /** Discard the pending invocation without executing. */
  cancel(): void;
  /** Whether an invocation is currently scheduled. */
  isPending(): boolean;
}

/**
 * Create a debounced handle around `fn`.
 *
 * @param fn       The function to debounce. May return void or Promise<void>;
 *                 the return value is intentionally ignored by the timer so that
 *                 async errors propagate only through flush() callers.
 * @param delayMs  Debounce window in milliseconds.
 */
export function createDebounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void | Promise<void>,
  delayMs: number,
): DebouncedHandle<TArgs> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: TArgs | null = null;

  function execute(): void {
    const args = pendingArgs;
    pendingArgs = null;
    timerId = null;
    if (args !== null) {
      fn(...args);
    }
  }

  function call(...args: TArgs): void {
    pendingArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(execute, delayMs);
  }

  function flush(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (pendingArgs !== null) {
      const args = pendingArgs;
      pendingArgs = null;
      fn(...args);
    }
  }

  function cancel(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    pendingArgs = null;
  }

  function isPending(): boolean {
    return timerId !== null;
  }

  return { call, flush, cancel, isPending };
}
