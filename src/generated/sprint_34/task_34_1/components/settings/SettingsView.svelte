<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { onMount } from 'svelte';
  import { getConfig, setConfig } from '../../ipc';
  import { configStore } from '../../stores/config';
  import type { AppConfig } from '../../types';

  let currentConfig: AppConfig | null = null;
  let saving = false;
  let success = false;
  let loadError = false;

  onMount(async () => {
    try {
      const config = await getConfig();
      currentConfig = config;
      configStore.set(config);
    } catch (err) {
      console.error('Failed to load config:', err);
      loadError = true;
    }
  });

  async function handleChangeDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '保存ディレクトリを選択',
      });
      if (!selected || typeof selected !== 'string') return;

      saving = true;
      const newConfig: AppConfig = { notes_dir: selected };
      await setConfig(newConfig);
      currentConfig = newConfig;
      configStore.set(newConfig);
      success = true;
      setTimeout(() => {
        success = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to set config:', err);
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-page">
  <h1 class="title">設定</h1>

  <section class="section">
    <h2 class="section-title">保存ディレクトリ</h2>
    {#if loadError}
      <p class="error-msg">設定の読み込みに失敗しました</p>
    {:else}
      <div class="dir-row">
        <code class="dir-path">{currentConfig?.notes_dir ?? '読み込み中...'}</code>
        <button
          class="change-btn"
          on:click={handleChangeDirectory}
          disabled={saving || !currentConfig}
        >
          {saving ? '変更中...' : 'ディレクトリを変更'}
        </button>
      </div>
      {#if success}
        <p class="success-msg">保存ディレクトリを変更しました</p>
      {/if}
      <p class="hint">
        変更後は新しいディレクトリのノートのみが読み込まれます。既存ノートは移動されません。
      </p>
    {/if}
  </section>
</div>

<style>
  .settings-page {
    padding: 32px;
    max-width: 600px;
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 24px;
  }

  .section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }

  .dir-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .dir-path {
    flex: 1;
    font-size: 13px;
    background: #f8fafc;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    color: #374151;
    word-break: break-all;
    font-family: monospace;
  }

  .change-btn {
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    transition: background 0.15s ease;
  }

  .change-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .change-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .success-msg {
    color: #22c55e;
    font-size: 13px;
    margin-top: 8px;
  }

  .error-msg {
    color: #dc2626;
    font-size: 13px;
  }

  .hint {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 10px;
    line-height: 1.5;
  }
</style>
