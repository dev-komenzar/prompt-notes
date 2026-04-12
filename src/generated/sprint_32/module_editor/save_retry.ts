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

// Auto-retry manager for saveNote.
// Policy (editor_clipboard_design.md §4.7):
//   - On failure: retry after 3 s, up to 3 retries (4 total attempts).
//   - No notification on initial failure or any retry failure.
//   - After the 3rd retry also fails: invoke onMaxRetriesExceeded().
// Calling attempt() with a new saveFn cancels any in-flight retry and starts fresh.

const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 3000;

export interface SaveRetryManager {
  /**
   * Start a save attempt for `saveFn`.
   * Any pending retry for a previous attempt is cancelled first.
   */
  attempt(saveFn: () => Promise<void>): void;
  /** Cancel a pending retry (call on component destroy or note switch). */
  cancel(): void;
}

export function createSaveRetryManager(
  onMaxRetriesExceeded: () => void,
): SaveRetryManager {
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let currentSaveFn: (() => Promise<void>) | null = null;

  function cancel(): void {
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    retryCount = 0;
    currentSaveFn = null;
  }

  async function execute(): Promise<void> {
    if (!currentSaveFn) return;
    try {
      await currentSaveFn();
      retryCount = 0;
    } catch {
      // All retries exhausted — show banner and stop.
      if (retryCount >= MAX_RETRIES) {
        retryCount = 0;
        currentSaveFn = null;
        onMaxRetriesExceeded();
        return;
      }
      retryCount++;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        execute();
      }, RETRY_INTERVAL_MS);
    }
  }

  function attempt(saveFn: () => Promise<void>): void {
    cancel();
    currentSaveFn = saveFn;
    execute();
  }

  return { attempt, cancel };
}
