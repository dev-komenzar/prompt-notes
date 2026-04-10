// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-3
// @task-title: styles
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

```ts
export { frontmatterDecoration } from './frontmatter-decoration';

/*
 * CSS to include in src/lib/styles/editor.css (or imported via a bundler):
 *
 * .cm-frontmatter-bg {
 *   background-color: rgba(59, 130, 246, 0.08);
 * }
 */
```

---

The canonical CSS rule belongs in `src/lib/styles/editor.css` (outside the generated output directory). Here it is for direct placement:

```css
/* src/lib/styles/editor.css */
.cm-frontmatter-bg {
  background-color: rgba(59, 130, 246, 0.08);
}
```

The `frontmatterDecoration` ViewPlugin itself is re-exported from `src/generated/sprint_29/lib` (Task 29-2), avoiding re-implementation per the sprint's ABSOLUTE PROHIBITION constraint.
