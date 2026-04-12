<!-- SettingsView: notes directory change only. No frontend file-path construction.
     All persistence goes through invoke('set_config') — module:settings convention. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { configStore } from '../../stores/config';
  import { getConfig, setConfig } from '../../lib/ipc';
  import type { AppConfig } from '../../lib/types';

  let config: AppConfig | null = null;
  let saving = false;
  let message = '';
  let messageType: 'success' | 'error' = 'success';

  onMount(async () => {
    try {
      config = await getConfig();
      configStore.set(config);
    } catch (e) {
      console.error('Failed to load config:', e);
      showMessage('設定の読み込みに失敗しました', 'error');
    }
  });

  async function handleChangeDirectory() {
    let selected: string | string[] | null;
    try {
      selected = await open({ directory: true, multiple: false, title: '保存ディレクトリを選択' });
    } catch (e) {
      console.error('Dialog error:', e);
      showMessage('ディレクトリ選択ダイアログを開けませんでした', 'error');
      return;
    }

    if (!selected || typeof selected !== 'string') return;

    saving = true;
    try {
      const newConfig: AppConfig = { notes_dir: selected };
      await setConfig(newConfig);
      config = newConfig;
      configStore.set(newConfig);
      showMessage('保存ディレクトリを変更しました', 'success');
    } catch (e) {
      console.error('Failed to set config:', e);
      showMessage('ディレクトリの変更に失敗しました', 'error');
    } finally {
      saving = false;
    }
  }

  function showMessage(msg: string, type: 'success' | 'error') {
    message = msg;
    messageType = type;
    setTimeout(() => { message = ''; }, 3000);
  }
</script>

<div class="settings-view">
  <h1 class="page-title">設定</h1>

  <section class="section">
    <h2 class="section-title">保存ディレクトリ</h2>
    <div class="dir-row">
      <code class="dir-path">{config?.notes_dir ?? '読み込み中...'}</code>
      <button
        type="button"
        class="change-btn"
        on:click={handleChangeDirectory}
        disabled={saving}
      >
        {saving ? '変更中...' : 'ディレクトリを変更'}
      </button>
    </div>
    {#if message}
      <p class="message" class:error={messageType === 'error'}>{message}</p>
    {/if}
    <p class="hint">
      ※ 変更後、既存ノートは移動されません。新ディレクトリ内のノートのみ表示されます。<br />
      Obsidian vault 内のサブディレクトリを指定する使い方もサポートしています。
    </p>
  </section>
</div>

<style>
  .settings-view {
    padding: 40px;
    max-width: 640px;
  }
  .page-title {
    font-size: 22px;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 28px;
  }
  .section { margin-bottom: 32px; }
  .section-title {
    font-size: 15px;
    font-weight: 500;
    color: #e2e8f0;
    margin-bottom: 12px;
  }
  .dir-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .dir-path {
    flex: 1;
    padding: 8px 12px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    font-size: 12px;
    color: #94a3b8;
    word-break: break-all;
    font-family: 'JetBrains Mono', monospace;
  }
  .change-btn {
    padding: 8px 18px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .change-btn:hover:not(:disabled) { background: #2563eb; }
  .change-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .message {
    font-size: 13px;
    color: #4ade80;
    margin-bottom: 8px;
  }
  .message.error { color: #f87171; }
  .hint {
    font-size: 12px;
    color: #475569;
    line-height: 1.6;
  }
</style>
