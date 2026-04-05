// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Debounce Utility
// Used by module:editor (auto-save 500ms) and module:grid (search 300ms).
// CoDD trace: detail:editor_clipboard, detail:grid_search

/**
 * Creates a debounced version of the given async or sync function.
 * Resets the timer on each call; only the last invocation within the
 * delay window actually executes.
 *
 * @param fn - The function to debounce.
 * @param delayMs - Debounce delay in milliseconds.
 * @returns An object with `call` (trigger), `flush` (immediate execution),
 *          and `cancel` (discard pending) methods.
 */
export function createDebounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn | Promise<TReturn>,
  delayMs: number,
): DebouncedFn<TArgs, TReturn> {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: TArgs | null = null;
  let pendingResolve: ((value: TReturn | Promise<TReturn>) => void) | null = null;

  function clear(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    pendingArgs = null;
    pendingResolve = null;
  }

  function call(...args: TArgs): Promise<TReturn> {
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    return new Promise<TReturn>((resolve) => {
      pendingArgs = args;
      pendingResolve = resolve as (value: TReturn | Promise<TReturn>) => void;

      timerId = setTimeout(() => {
        timerId = null;
        const currentArgs = pendingArgs!;
        const currentResolve = pendingResolve!;
        pendingArgs = null;
        pendingResolve = null;
        currentResolve(fn(...currentArgs));
      }, delayMs);
    });
  }

  async function flush(): Promise<TReturn | undefined> {
    if (timerId !== null && pendingArgs !== null) {
      clearTimeout(timerId);
      timerId = null;
      const currentArgs = pendingArgs;
      const currentResolve = pendingResolve;
      pendingArgs = null;
      pendingResolve = null;
      const result = await fn(...currentArgs);
      if (currentResolve) {
        currentResolve(result);
      }
      return result;
    }
    return undefined;
  }

  function cancel(): void {
    clear();
  }

  function isPending(): boolean {
    return timerId !== null;
  }

  return { call, flush, cancel, isPending };
}

/** Interface for the debounced function wrapper. */
export interface DebouncedFn<TArgs extends unknown[], TReturn> {
  /** Trigger the debounced function. Resets timer on repeated calls. */
  call: (...args: TArgs) => Promise<TReturn>;
  /** Execute immediately if a call is pending. Resolves the pending promise. */
  flush: () => Promise<TReturn | undefined>;
  /** Cancel any pending execution. */
  cancel: () => void;
  /** Check whether a call is pending. */
  isPending: () => boolean;
}
