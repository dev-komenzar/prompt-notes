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
 * SvelteKit app.html shell.
 * Minimal HTML document served by Vite dev server on localhost:1420.
 * No external resources, no network requests (privacy/NNC compliance).
 */
export const APP_HTML = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PromptNotes</title>
    %sveltekit.head%
  </head>
  <body>
    <div style="display:contents">%sveltekit.body%</div>
  </body>
</html>
`;
