<script lang="ts">
  import { onMount } from 'svelte';
  import { createNoteAndRedirect } from '../edit/redirect';
  import type { CreateNoteResult } from '../edit/redirect';

  let error: string | null = null;

  onMount(async () => {
    try {
      await createNoteAndRedirect();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  });
</script>

{#if error}
  <div class="error">ノートの作成に失敗しました: {error}</div>
{/if}
