<!-- CoDD Trace: plan:implementation_plan > sprint:52 > task:52-1 -->
<!-- Module: components/settings/Settings — Directory config via Rust backend -->
<!-- CONV: 設定変更（保存ディレクトリ）はRustバックエンド経由で永続化。フロントエンド単独でのファイルパス操作は禁止。 -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { getConfig, setConfig } from '../../lib/api';
  import { navigateToGrid } from '../../lib/stores';

  let notesDir = '';
  let originalDir = '';
  let isSaving = false;
  let isLoading = true;
  let statusMessage = '';
  let statusType: 'success' | 'error' | '' = '';

  async function loadConfig(): Promise<void> {
    isLoading = true;
    try {
      const config = await getConfig();
      notesDir = config.notes_dir;
      originalDir = config.notes_dir;
    } catch (err) {
      console.error('[Settings] Failed to load config:', err);
      statusMessage = '設定の読み込みに失敗しました。';
      statusType = 'error';
    } finally {
      isLoading = false;
    }
  }

  async function handleSelectDirectory(): Promise<void> {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '保存ディレクトリを選択',
      });
      if (typeof selected === 'string') {
        notesDir = selected;
      }
    } catch (err) {
      console.error('[Settings] Directory picker error:', err);
    }
  }

  async function handleSave(): Promise<void> {
    if (!notesDir.trim()) return;
    isSaving = true;
    statusMessage = '';
    statusType = '';
    try {
      await setConfig({ notes_dir: notesDir });
      originalDir = notesDir;
      statusMessage = '設定を保存しました。';
      statusType = 'success';
    } catch (err) {
      console.error('[Settings] Failed to save config:', err);
      statusMessage = '設定の保存に失敗しました。ディレクトリを確認してください。';
      statusType = 'error';
    } finally {
      isSaving = false;
    }
  }

  function handleBack(): void {
    navigateToGrid();
  }

  $: hasChanges = notesDir !== originalDir;

  onMount(() => {
    loadConfig();
  });
</script>

<div class="settings-screen">
  <header class="settings-header">
    <button class="back-btn" on:click={handleBack} aria-label="グリッドビューに戻る">
      ← 戻る
    </button>
    <h1 class="settings-title">設定</h1>
  </header>

  <main class="settings-content">
    {#if isLoading}
      <div class="settings-loading">読み込み中…</div>
    {:else}
      <section class="setting-group">
        <h2 class="setting-label">保存ディレクトリ</h2>
        <p class="setting-description">
          ノートファイル (.md) の保存先ディレクトリを指定します。変更後、新規ノートは新しいディレクトリに保存されます。
        </p>
        <div class="directory-row">
          <input
            type="text"
            class="directory-input"
            bind:value={notesDir}
            readonly
            aria-label="保存ディレクトリパス"
          />
          <button class="browse-btn" on:click={handleSelectDirectory}>
            参照…
          </button>
        </div>
        <div class="save-row">
          <button
            class="save-btn"
            on:click={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? '保存中…' : '保存'}
          </button>
          {#if statusMessage}
            <span class="status-msg" class:success={statusType === 'success'} class:error={statusType === 'error'}>
              {statusMessage}
            </span>
          {/if}
        </div>
      </section>
    {/if}
  </main>
</div>

<style>
  .settings-screen {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background-color: var(--settings-bg, #f8fafc);
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    background-color: var(--header-bg, #ffffff);
    flex-shrink: 0;
  }

  .back-btn {
    background: none;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-color, #334155);
    transition: background-color 0.15s ease;
  }

  .back-btn:hover {
    background-color: var(--hover-bg, #f1f5f9);
  }

  .settings-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color, #0f172a);
    margin: 0;
  }

  .settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 16px;
    max-width: 640px;
  }

  .settings-loading {
    color: var(--text-muted, #94a3b8);
    font-size: 14px;
    padding: 24px 0;
  }

  .setting-group {
    background-color: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    padding: 20px;
  }

  .setting-label {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color, #0f172a);
    margin: 0 0 4px;
  }

  .setting-description {
    font-size: 13px;
    color: var(--text-muted, #64748b);
    margin: 0 0 12px;
    line-height: 1.5;
  }

  .directory-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .directory-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-color, #334155);
    background-color: var(--input-bg-readonly, #f8fafc);
    outline: none;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .browse-btn {
    padding: 8px 16px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    background-color: var(--btn-bg, #ffffff);
    color: var(--text-color, #334155);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.15s ease;
  }

  .browse-btn:hover {
    background-color: var(--hover-bg, #f1f5f9);
  }

  .save-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .save-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 6px;
    background-color: var(--primary-color, #3b82f6);
    color: #ffffff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .save-btn:hover:not(:disabled) {
    background-color: var(--primary-dark, #2563eb);
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .status-msg {
    font-size: 13px;
  }

  .status-msg.success {
    color: var(--success-color, #22c55e);
  }

  .status-msg.error {
    color: var(--error-color, #ef4444);
  }
</style>
