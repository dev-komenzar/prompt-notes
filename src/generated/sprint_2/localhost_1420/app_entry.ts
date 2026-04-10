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
 * SvelteKit root +page.svelte content for the empty app shell.
 * This is the minimal page component that renders when the app boots.
 * No title input, no markdown preview, no network calls (NNC compliance).
 */
export const ROOT_PAGE_SVELTE = `<script lang="ts">
  // Empty app shell — Sprint 2 bootstrap
</script>

<main class="app-shell">
  <p>PromptNotes</p>
</main>

<style>
  .app-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #333;
    background-color: #fafafa;
  }
</style>
`;
