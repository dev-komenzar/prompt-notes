<!-- @codd: design:system-design §2.8 / detail:component_architecture §3.4 -->
<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { configStore } from './config.store';
  import type { AppConfig } from './types';

  let errorMessage = '';
  let successMessage = '';

  $: currentDir = ($configStore as AppConfig | null)?.notes_dir ?? '読み込み中...';

  async function handleChangeDirectory() {
    errorMessage = '';
    successMessage = '';

    // ネイティブ OS ダイアログでディレクトリ選択（フロントエンドがパスを直接構築することを禁止するため dialog プラグイン経由）
    const selected = await open({ directory: true, multiple: false });
    if (!selected || typeof selected !== 'string') return;

    try {
      await configStore.changeNotesDir(selected);
      successMessage = `保存ディレクトリを変更しました: ${selected}`;
    } catch (err) {
      errorMessage = `ディレクトリの変更に失敗しました: ${String(err)}`;
    }
  }
</script>

<div class="settings-view">
  <h2>設定</h2>

  <section class="setting-row">
    <label>保存ディレクトリ</label>
    <div class="dir-display">
      <span class="dir-path" title={currentDir}>{currentDir}</span>
      <button class="change-btn" on:click={handleChangeDirectory}>
        変更...
      </button>
    </div>
    <p class="hint">
      変更後は新しいディレクトリのノートのみが読み込まれます。既存ノートの移動は行われません。
    </p>
  </section>

  {#if successMessage}
    <p class="success" role="status">{successMessage}</p>
  {/if}
  {#if errorMessage}
    <p class="error" role="alert">{errorMessage}</p>
  {/if}
</div>

<style>
  .settings-view {
    padding: 24px;
    max-width: 640px;
  }

  h2 {
    margin-bottom: 24px;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .setting-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  label {
    font-weight: 500;
    font-size: 0.9rem;
  }

  .dir-display {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dir-path {
    flex: 1;
    background: var(--input-bg, #f3f4f6);
    border: 1px solid var(--border, #d1d5db);
    border-radius: 6px;
    padding: 8px 12px;
    font-family: monospace;
    font-size: 0.85rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .change-btn {
    padding: 8px 16px;
    border: 1px solid var(--border, #d1d5db);
    border-radius: 6px;
    background: var(--btn-bg, #fff);
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .change-btn:hover {
    background: var(--btn-hover-bg, #f3f4f6);
  }

  .hint {
    font-size: 0.8rem;
    color: var(--muted, #6b7280);
    margin: 0;
  }

  .success {
    color: var(--success, #16a34a);
    font-size: 0.875rem;
  }

  .error {
    color: var(--error, #dc2626);
    font-size: 0.875rem;
  }
</style>
