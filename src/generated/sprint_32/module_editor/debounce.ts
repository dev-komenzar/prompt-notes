// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §4.5, detail:component_architecture §4.2

/**
 * Creates a debounced version of the given callback.
 * Used for auto-save (500ms) to limit IPC call frequency.
 *
 * @param callback - The function to debounce
 * @param delayMs - Debounce interval in milliseconds
 * @returns Object with the debounced function and flush/cancel controls
 */
export function createDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delayMs: number
): {
  call: (...args: Parameters<T>) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Parameters<T> | null = null;

  function call(...args: Parameters<T>): void {
    pendingArgs = args;
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      const a = pendingArgs;
      pendingArgs = null;
      if (a !== null) {
        callback(...a);
      }
    }, delayMs);
  }

  function flush(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (pendingArgs !== null) {
      const a = pendingArgs;
      pendingArgs = null;
      callback(...a);
    }
  }

  function cancel(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    pendingArgs = null;
  }

  return { call, flush, cancel };
}
