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

import { ROOT_PAGE_SVELTE } from './app_entry';
import { ROOT_LAYOUT_TS, ROOT_LAYOUT_SVELTE } from './root_layout';
import { APP_HTML } from './app_html';
import { VITE_CONFIG_TS } from './dev_server_config';

/**
 * Scaffold map: relative file paths to their generated content.
 * These files constitute the minimal set needed for `tauri dev`
 * to serve an empty app at http://localhost:1420.
 *
 * This map complements the Sprint 2 Task 2-1 scaffold by providing
 * the actual runnable SvelteKit page/layout content.
 */
export const SCAFFOLD_MAP: Record<string, string> = {
  'src/app.html': APP_HTML,
  'src/routes/+page.svelte': ROOT_PAGE_SVELTE,
  'src/routes/+layout.ts': ROOT_LAYOUT_TS,
  'src/routes/+layout.svelte': ROOT_LAYOUT_SVELTE,
  'vite.config.ts': VITE_CONFIG_TS,
};

export {
  ROOT_PAGE_SVELTE,
  ROOT_LAYOUT_TS,
  ROOT_LAYOUT_SVELTE,
  APP_HTML,
  VITE_CONFIG_TS,
};
