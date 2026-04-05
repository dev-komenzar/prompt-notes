// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:shell – Tauri v2 application lifecycle management
// Sprint 3 – OQ-005 resolved: Tauri v2
//
// Responsibilities:
//   - Window close-requested handler: flushes pending auto-saves before exit.
//   - Provides a registration mechanism for flush callbacks so that
//     module:editor can register its debounced save without tight coupling.
//
// Tauri v2 specifics:
//   - getCurrentWindow() from @tauri-apps/api/window (v2 path)
//   - onCloseRequested() replaces v1's window.__TAURI__.event.listen approach
//   - Permissions: core:window:allow-close must be granted in capabilities
//
// Ref: detail:editor_clipboard §4.5 – auto-save lifecycle
// Ref: detail:component_architecture §1 – module:shell lifecycle management

import { getCurrentWindow } from '@tauri-apps/api/window';

type FlushCallback = () => Promise<void>;

const flushCallbacks: Set<FlushCallback> = new Set();
let lifecycleInitialized = false;

/**
 * Register a callback to be invoked when the application window is closing.
 * Used by module:editor to flush pending debounced auto-saves.
 *
 * @returns An unregister function. Call it on component destroy.
 *
 * @example
 * ```ts
 * // In Editor.svelte onMount:
 * const unregister = registerFlushCallback(async () => {
 *   await debouncedSave.flush();
 * });
 *
 * // In onDestroy:
 * unregister();
 * ```
 */
export function registerFlushCallback(callback: FlushCallback): () => void {
  flushCallbacks.add(callback);
  return () => {
    flushCallbacks.delete(callback);
  };
}

/**
 * Execute all registered flush callbacks.
 * Errors in individual callbacks are caught and logged so that
 * one failing callback does not prevent others from executing.
 */
async function flushAll(): Promise<void> {
  const results = await Promise.allSettled(
    Array.from(flushCallbacks).map((cb) => cb()),
  );
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[lifecycle] Flush callback failed:', result.reason);
    }
  }
}

/**
 * Initialize Tauri v2 window lifecycle handlers.
 * Must be called once at application startup (e.g., in App.svelte onMount).
 *
 * Sets up:
 *   - onCloseRequested: flushes all pending operations before window close.
 *
 * Idempotent: subsequent calls are no-ops.
 */
export async function initializeLifecycle(): Promise<void> {
  if (lifecycleInitialized) return;
  lifecycleInitialized = true;

  const appWindow = getCurrentWindow();

  await appWindow.onCloseRequested(async () => {
    await flushAll();
    // After flushAll completes, the window closes normally.
    // Do NOT call event.preventDefault() — we want to close after flushing.
  });
}

/**
 * Programmatically trigger all flush callbacks.
 * Called during note switching to ensure pending saves complete
 * before loading a different note.
 */
export async function flushPendingOperations(): Promise<void> {
  await flushAll();
}
