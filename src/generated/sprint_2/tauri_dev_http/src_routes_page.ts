// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `tauri dev` で `http:
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// traceability: sprint_2/task_2-1 — SvelteKit index page (empty app shell)
// This file should be placed at src/routes/+page.svelte
//
// <script lang="ts">
//   // PromptNotes — Sprint 2 empty app shell
//   // Future: module:grid will render the Pinterest-style Masonry grid here
// </script>
//
// <main class="app-container">
//   <h1>PromptNotes</h1>
//   <p>App is running.</p>
// </main>
//
// <style>
//   .app-container {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     min-height: 100vh;
//     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//     color: #1a1a1a;
//   }
//   h1 {
//     font-size: 2rem;
//     margin-bottom: 0.5rem;
//   }
//   p {
//     color: #666;
//   }
// </style>

export const PAGE_COMPONENT = 'src/routes/+page.svelte';
