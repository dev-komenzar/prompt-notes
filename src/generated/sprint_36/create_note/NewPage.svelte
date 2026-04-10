<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { invoke } from '@tauri-apps/api/core';

  let error: string | null = null;

  onMount(async () => {
    try {
      const result = await invoke<{ filename: string; path: string }>('create_note');
      await goto(`/edit/${encodeURIComponent(result.filename)}`, { replaceState: true });
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  });
</script>

{#if error}
  <div class="error">
    <p>ノートの作成に失敗しました: {error}</p>
    <a href="/">グリッドビューに戻る</a>
  </div>
{/if}

<style>
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 1rem;
    color: #dc2626;
  }
</style>
