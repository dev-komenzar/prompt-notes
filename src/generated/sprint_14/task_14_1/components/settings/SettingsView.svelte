<!-- @generated-from: docs/detailed_design/storage_fileformat_design.md §2.3 -->
<!-- All config changes go through Rust backend via IPC — direct FS path ops forbidden -->
<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { onMount } from 'svelte';
  import { configStore } from '../../stores/config';
  import { getConfig, setConfig } from '../../lib/ipc';
  import type { AppConfig } from '../../lib/types';

  let config: AppConfig | null = null;
  let saving = false;
  let successMsg: string | null = null;
  let errorMsg: string | null = null;

  onMount(async () => {
    try {
      config = await getConfig();
      configStore.set(config);
    } catch {
      errorMsg = '設定の読み込みに失敗しました。';
    }
  });

  async function handleSelectDir(): Promise<void> {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (!selected || typeof selected !== 'string') return;
      saving = true;
      const newConfig: AppConfig = { notes_dir: selected };
      await setConfig(newConfig);
      config = newConfig;
      configStore.set(newConfig);
      successMsg = '保存ディレクトリを変更しました。';
      setTimeout(() => { successMsg = null; }, 3000);
    } catch {
      errorMsg = 'ディレクトリの変更に失敗しました。';
      setTimeout(() => { errorMsg = null; }, 3000);
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-view">
  <header class="hdr">
    <a href="#/" class="back">← 戻る</a>
    <h1>設定</h1>
  </header>
  <div class="content">
    {#if successMsg}<div class="banner success" role="status">{successMsg}</div>{/if}
    {#if errorMsg}<div class="banner error" role="alert">{errorMsg}</div>{/if}
    <section>
      <h2>保存ディレクトリ</h2>
      <p class="dir-path">{config?.notes_dir ?? '読み込み中...'}</p>
      <button class="change-btn" on:click={handleSelectDir} disabled={saving}>
        {saving ? '変更中...' : 'ディレクトリを変更'}
      </button>
      <p class="hint">
        変更後は新しいディレクトリ内のノートのみが表示されます。既存ノートの移動は行いません。
      </p>
    </section>
  </div>
</div>

<style>
  .settings-view { height: 100%; display: flex; flex-direction: column; background: #fff; }
  .hdr {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 24px; border-bottom: 1px solid #e2e8f0;
  }
  .hdr h1 { margin: 0; font-size: 20px; font-weight: 600; color: #2d3748; }
  .back { color: #4299e1; font-size: 14px; text-decoration: none; padding: 4px 8px; }
  .content { flex: 1; padding: 24px; overflow-y: auto; max-width: 600px; }
  .banner {
    padding: 10px 14px; border-radius: 4px; font-size: 14px; margin-bottom: 16px;
  }
  .banner.success { background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
  .banner.error   { background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }
  section h2 { font-size: 16px; font-weight: 600; color: #2d3748; margin: 0 0 8px; }
  .dir-path {
    font-family: monospace; font-size: 13px; color: #718096;
    background: #f7fafc; padding: 8px 12px; border-radius: 4px;
    border: 1px solid #e2e8f0; word-break: break-all; margin-bottom: 12px;
  }
  .change-btn {
    padding: 8px 16px; background: #4299e1; color: #fff;
    border: none; border-radius: 4px; font-size: 14px; cursor: pointer;
    transition: background 0.15s;
  }
  .change-btn:hover:not(:disabled) { background: #3182ce; }
  .change-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .hint { margin-top: 8px; font-size: 12px; color: #718096; line-height: 1.5; }
</style>
