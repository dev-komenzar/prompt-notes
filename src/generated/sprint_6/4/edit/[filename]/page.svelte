// @generated-from: docs/plan/implementation_plan.md
// @sprint: 6
// @task: 6-1
// Route: /edit/[filename] (Editor - module:editor)
```

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  $: filename = $page.params.filename;
  // Editor page - module:editor
  // IPC dependencies: read_note, save_note, create_note
</script>

<main data-route="editor" data-filename={filename}>
</main>
