// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 22-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=22, task=22-1, module=module:shell
// Debounce utility used by module:editor (auto-save, 500ms)
// and module:grid (search input, 300ms).

/**
 * Creates a debounced version of the given callback function.
 * The callback is invoked after `delayMs` milliseconds of inactivity.
 * Each new call resets the timer.
 *
 * @param callback - The function to debounce
 * @param delayMs - Delay in milliseconds before invoking the callback
 * @returns An object with `call` to trigger the debounce and `flush` to execute immediately
 */
export function createDebounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void | Promise<void>,
  delayMs: number,
): {
  call: (...args: TArgs) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: TArgs | null = null;

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    latestArgs = null;
  }

  function flush(): void {
    if (timeoutId !== null && latestArgs !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      const args = latestArgs;
      latestArgs = null;
      callback(...args);
    }
  }

  function call(...args: TArgs): void {
    latestArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const currentArgs = latestArgs;
      latestArgs = null;
      if (currentArgs !== null) {
        callback(...currentArgs);
      }
    }, delayMs);
  }

  return { call, flush, cancel };
}
