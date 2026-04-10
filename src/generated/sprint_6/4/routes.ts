// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 6-1
// @task-title: 4 ルートが空ページとして表示される
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 6
// @task: 6-1
// SvelteKit route manifest for promptnotes
// All file operations go through Tauri IPC — no direct filesystem access from frontend.

/**
 * Route definitions matching SvelteKit file-based routing.
 *
 * | Path              | Page File                              | Module          |
 * |-------------------|----------------------------------------|-----------------|
 * | /                 | src/routes/+page.svelte                | module:grid     |
 * | /edit/[filename]  | src/routes/edit/[filename]/+page.svelte | module:editor   |
 * | /new              | src/routes/new/+page.svelte            | module:editor   |
 * | /settings         | src/routes/settings/+page.svelte       | module:settings |
 */
export const ROUTES = {
  GRID: '/',
  EDITOR: (filename: string) => `/edit/${encodeURIComponent(filename)}` as const,
  NEW: '/new',
  SETTINGS: '/settings',
} as const;

export type AppRoute = typeof ROUTES;
