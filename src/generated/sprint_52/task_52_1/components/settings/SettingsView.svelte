<!-- @generated-from: docs/design/system_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { getConfig, setConfig } from '../../lib/ipc';
  import { configStore } from '../../stores/config';
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';

  let notesDir = '';
  let saving = false;
  let successMsg = '';
  let errorMsg = '';

  onMount(async () => {
    try {
      const config = await getConfig();
      notesDir = config.notes_dir;
      configStore.set(config);
    } catch {
      errorMsg = '設定の読み込みに失敗しました。';
    }
  });

  async function handleSelectDir() {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === 'string') {
      notesDir = selected;
    }
  }

  async function handleSave() {
    if (!notesDir) return;
    saving = true;
    errorMsg = '';
    successMsg = '';
    try {
      await setConfig({ notes_dir: notesDir });
      configStore.update((c) => (c ? { ...c, notes_dir: notesDir } : { notes_dir: notesDir }));
      successMsg = '保存しました。';
      setTimeout(() => {
        successMsg = '';
      }, 3000);
    } catch {
      errorMsg = '設定の保存に失敗しました。';
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-page">
  <nav class="top-nav">
    <button class="nav-btn" on:click={() => push('/')}>← エディタ</button>
    <h1 class="nav-title">設定</h1>
    <div></div>
  </nav>

  <div class="settings-body">
    <section class="setting-section">
      <h2 class="section-title">保存ディレクトリ</h2>
      <p class="section-desc">
        ノートファイル（.md）の保存先ディレクトリを指定します。
        Obsidian vault 内のサブディレクトリも指定できます。
      </p>

      <div class="dir-input-row">
        <input
          class="dir-input"
          type="text"
          readonly
          value={notesDir}
          placeholder="ディレクトリが選択されていません"
          aria-label="保存ディレクトリ"
        />
        <button class="select-btn" on:click={handleSelectDir}>選択...</button>
      </div>

      <p class="dir-hint">
        変更後は新しいディレクトリのノートのみ表示されます。既存ノートの移動は行いません。
      </p>

      {#if successMsg}
        <p class="success-msg">{successMsg}</p>
      {/if}
      {#if errorMsg}
        <p class="error-msg">{errorMsg}</p>
      {/if}

      <button
        class="save-btn"
        on:click={handleSave}
        disabled={saving || !notesDir}
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </section>
  </div>
</div>

<style>
  .settings-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--page-bg, #f7fafc);
  }

  .top-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--nav-bg, #2d3748);
    color: #fff;
  }

  .nav-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .nav-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s ease;
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-body {
    flex: 1;
    padding: 32px;
    overflow-y: auto;
  }

  .setting-section {
    max-width: 600px;
    background: var(--card-bg, #fff);
    border-radius: 8px;
    border: 1px solid var(--border-color, #e2e8f0);
    padding: 24px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text, #2d3748);
    margin: 0 0 8px;
  }

  .section-desc {
    font-size: 13px;
    color: var(--muted, #718096);
    margin: 0 0 16px;
    line-height: 1.5;
  }

  .dir-input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .dir-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    font-size: 13px;
    background: var(--input-bg-readonly, #f7fafc);
    color: var(--text, #4a5568);
    font-family: monospace;
  }

  .select-btn {
    padding: 8px 16px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 4px;
    background: var(--chip-bg, #fff);
    color: var(--text, #4a5568);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.1s ease;
  }

  .select-btn:hover {
    background: var(--hover-bg, #edf2f7);
  }

  .dir-hint {
    font-size: 12px;
    color: var(--muted, #a0aec0);
    margin: 0 0 16px;
  }

  .save-btn {
    padding: 10px 24px;
    background: var(--accent, #4299e1);
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.1s ease;
  }

  .save-btn:hover:not(:disabled) {
    background: var(--accent-dark, #3182ce);
  }

  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .success-msg {
    color: #38a169;
    font-size: 13px;
    margin: 0 0 12px;
  }

  .error-msg {
    color: #e53e3e;
    font-size: 13px;
    margin: 0 0 12px;
  }
</style>
