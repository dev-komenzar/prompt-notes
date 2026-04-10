<!--
  Traceability: sprint=36, task=36-2, module=edit
  Route: /new
  Deliverable: create_note → /edit/:filename 即時リダイレクト
  本コンポーネントは src/routes/new/+page.svelte に配置する想定。
  /new ルートは独立した画面を持たず、即座に /edit/:filename へリダイレクトする。
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createNoteAndRedirect } from './redirect';

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
  <p role="alert" style="color: red;">ノートの作成に失敗しました: {error}</p>
{/if}
