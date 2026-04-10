// @generated-from: docs/plan/implementation_plan.md
// @sprint: 6
// @task: 6-1
// Route: /new (New note - redirects to /edit/:filename)
```

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // /new route: invoke create_note via IPC, then redirect to /edit/:filename
  // Actual IPC call will be integrated in a later sprint.
  onMount(async () => {
    // Placeholder: redirect will be wired to create_note IPC command
    // const { filename } = await createNote();
    // await goto(`/edit/${filename}`);
  });
</script>

<main data-route="new">
</main>
