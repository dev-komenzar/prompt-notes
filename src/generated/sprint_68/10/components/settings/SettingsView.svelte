<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { open } from '@tauri-apps/plugin-dialog';
  import { getConfig, setConfig } from '../../lib/ipc';
  import { configStore } from '../../stores/config';
  import type { AppConfig } from '../../lib/types';

  let config: AppConfig | null = null;
  let saving = false;
  let statusMessage: string | null = null;
  let statusType: 'success' | 'error' = 'success';

  onMount(async () => {
    try {
      config = await getConfig();
      configStore.set(config);
    } catch {
      showStatus('設定の読み込みに失敗しました', 'error');
    }
  });

  async function handleSelectDirectory() {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === 'string' && selected) {
        saving = true;
        const newConfig: AppConfig = { notes_dir: selected };
        await setConfig(newConfig);
        config = newConfig;
        configStore.set(newConfig);
        showStatus('保存ディレクトリを変更しました', 'success');
      }
    } catch {
      showStatus('ディレクトリの変更に失敗しました', 'error');
    } finally {
      saving = false;
    }
  }

  function showStatus(msg: string, type: 'success' | 'error') {
    statusMessage = msg;
    statusType = type;
    setTimeout(() => { statusMessage = null; }, 3000);
  }
</script>

<div class="settings-view">
  <header class="settings-header">
    <button class="back-btn" on:click={() => push('/')} aria-label="エディタに戻る">
      ← 戻る
    </button>
    <h1>設定</h1>
  </header>

  <main class="settings-content">
    <section class="setting-section">
      <h2>保存ディレクトリ</h2>
      <p class="current-dir" aria-label="現在の保存ディレクトリ">
        {config?.notes_dir ?? '読み込み中...'}
      </p>
      <button
        class="change-btn"
        on:click={handleSelectDirectory}
        disabled={saving}
      >
        {saving ? '変更中...' : 'ディレクトリを変更'}
      </button>
      <p class="hint">
        変更後は新しいディレクトリのノートが表示されます。既存ノートの移動は行われません。
      </p>
    </section>
  </main>

  {#if statusMessage}
    <div
      class="status-toast"
      class:error={statusType === 'error'}
      role="status"
      aria-live="polite"
    >
      {statusMessage}
    </div>
  {/if}
</div>

<style>
  .settings-view {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-color, #ffffff);
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    flex-shrink: 0;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--accent-color, #3b82f6);
    font-size: 14px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.1s;
  }

  .back-btn:hover {
    background: var(--item-hover-bg, #f1f5f9);
  }

  h1 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--text-color, #1e293b);
  }

  .settings-content {
    flex: 1;
    padding: 32px 24px;
    overflow-y: auto;
  }

  .setting-section {
    max-width: 520px;
  }

  h2 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-color, #1e293b);
    margin: 0 0 10px;
  }

  .current-dir {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 13px;
    color: var(--muted-color, #64748b);
    background: var(--code-bg, #f1f5f9);
    padding: 10px 14px;
    border-radius: 6px;
    margin: 0 0 14px;
    word-break: break-all;
    border: 1px solid var(--border-color, #e2e8f0);
  }

  .change-btn {
    padding: 8px 18px;
    background: var(--accent-color, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .change-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .change-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .hint {
    font-size: 12px;
    color: var(--muted-color, #94a3b8);
    margin-top: 10px;
    line-height: 1.5;
  }

  .status-toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--toast-bg, #1e293b);
    color: white;
    padding: 10px 24px;
    border-radius: 20px;
    font-size: 13px;
    pointer-events: none;
    z-index: 200;
  }

  .status-toast.error {
    background: #dc2626;
  }
</style>
