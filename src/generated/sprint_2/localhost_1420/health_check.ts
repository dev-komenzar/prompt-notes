// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-2
// @task-title: localhost:1420` にて空のアプリが起動する
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @task: 2-2
// @deliverable: tauri dev で http://localhost:1420 にて空のアプリが起動する

/**
 * Health check utility to verify the dev server is responding on localhost:1420.
 * Used by E2E test helpers and CI pipelines before running tests.
 */

const DEV_SERVER_URL = 'http://localhost:1420';
const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 1000;

export async function waitForDevServer(
  url: string = DEV_SERVER_URL,
  maxRetries: number = MAX_RETRIES,
  intervalMs: number = RETRY_INTERVAL_MS,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(
    `Dev server at ${url} did not become ready after ${maxRetries} attempts`,
  );
}

export { DEV_SERVER_URL, MAX_RETRIES, RETRY_INTERVAL_MS };
