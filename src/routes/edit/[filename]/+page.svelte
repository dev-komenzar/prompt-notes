<script lang="ts">
  import { page } from '$app/stores';
  import EditorPage from '$lib/components/EditorPage.svelte';

  let filename = $derived($page.params.filename);
</script>

<EditorPage {filename} />
