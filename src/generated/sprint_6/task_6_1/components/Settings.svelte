<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { getConfig, setConfig, selectDirectory } from '../lib/api';

  const dispatch = createEventDispatcher<{
    navigate: { view: 'grid' };
  }>();

  let notesDir = '';
  let originalDir = '';
  let saving = false;
  let error = '';
  let success = '';

  onMount(async () => {
    try {
      const config = await getConfig();
      notesDir = config.notes_dir;
      originalDir = config.notes_dir;
    } catch (err) {
      error = '設定の読み込みに失敗しました';
      console.error('Failed to load config:', err);
    }
  });

  async function handleSelectDir(): Promise<void> {
    const selected = await selectDirectory();
    if (selected) {
      notesDir = selected;
    }
  }

  async function handleSave(): Promise<void> {
    if (!notesDir.trim()) {
      error = 'ディレクトリを指定してください';
      return;
    }
    saving = true;
    error = '';
    success = '';
    try {
      await setConfig({ notes_dir: notesDir });
      originalDir = notesDir;
      success = '設定を保存しました';
      setTimeout(() => { success = ''; }, 2000);
    } catch (err) {
      error = '設定の保存に失敗しました。ディレクトリを確認してください。';
      console.error('Failed to save config:', err);
    } finally {
      saving = false;
    }
  }

  function handleBack(): void {
    dispatch('navigate', { view: 'grid' });
  }
</script>

<div class="settings-screen">
  <div class="settings-header">
    <button class="back-button" on:click={handleBack}>← ノート一覧</button>
    <h2 class="settings-title">設定</h2>
  </div>
  <div class="settings-body">
    <div class="setting-group">
      <label class="setting-label" for="notes-dir">保存ディレクトリ</label>
      <div class="dir-row">
        <input
          id="notes-dir"
          type="text"
          class="dir-input"
          bind:value={notesDir}
          readonly
        />
        <button class="browse-button" on:click={handleSelectDir}>
          参照...
        </button>
      </div>
      <p class="setting-hint">
        ノートファイル (.md) の保存先ディレクトリを選択してください。
      </p>
    </div>
    {#if error}
      <div class="message error">{error}</div>
    {/if}
    {#if success}
      <div class="message success">{success}</div>
    {/if}
    <div class="actions">
      <button
        class="save-button"
        on:click={handleSave}
        disabled={saving || notesDir === originalDir}
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  </div>
</div>

<style>
  .settings-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .settings-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background: var(--toolbar-bg, #f9fafb);
  }
  .back-button {
    padding: 6px 12px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    font-size: 14px;
    color: var(--text-color, #374151);
  }
  .back-button:hover {
    background: var(--button-hover-bg, #f3f4f6);
  }
  .settings-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color, #1f2937);
  }
  .settings-body {
    padding: 24px 16px;
    max-width: 640px;
  }
  .setting-group {
    margin-bottom: 20px;
  }
  .setting-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-color, #374151);
  }
  .dir-row {
    display: flex;
    gap: 8px;
  }
  .dir-input {
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
    border: 1px solid var(--input-border, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #f9fafb);
    color: var(--text-color, #374151);
  }
  .browse-button {
    padding: 8px 16px;
    font-size: 13px;
    border: 1px solid var(--border-color, #d1d5db);
    border-radius: 6px;
    background: var(--button-bg, #ffffff);
    cursor: pointer;
    white-space: nowrap;
    color: var(--text-color, #374151);
  }
  .browse-button:hover {
    background: var(--button-hover-bg, #f3f4f6);
  }
  .setting-hint {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--text-secondary, #9ca3af);
  }
  .message {
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 12px;
  }
  .message.error {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }
  .message.success {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }
  .actions {
    padding-top: 8px;
  }
  .save-button {
    padding: 8px 24px;
    font-size: 14px;
    border: none;
    border-radius: 6px;
    background: var(--primary, #3b82f6);
    color: #ffffff;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .save-button:hover:not(:disabled) {
    background: var(--primary-hover, #2563eb);
  }
  .save-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
