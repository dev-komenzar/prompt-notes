<script lang="ts">
  import { onMount } from 'svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import {
    getSettingsState,
    loadSettings,
    saveSettings
  } from '$lib/stores/settings.svelte';
  import type { Config } from '$lib/types';

  const settingsState = getSettingsState();
  let notesDir = $state('');
  let saved = $state(false);

  onMount(async () => {
    await loadSettings();
    if (settingsState.config) {
      notesDir = settingsState.config.notes_dir;
    }
  });

  async function handleSave() {
    const config: Config = { notes_dir: notesDir };
    await saveSettings(config);
    saved = true;
    setTimeout(() => (saved = false), 2000);
  }
</script>

<TopBar title="設定" showBack />

<main class="settings-page" data-testid="settings-screen">
  {#if settingsState.loading}
    <div class="loading">読み込み中...</div>
  {:else if settingsState.error}
    <div class="error">エラー: {settingsState.error}</div>
  {:else}
    <div class="settings-form">
      <div class="form-group">
        <label class="form-label" for="notes-dir">ノート保存先ディレクトリ</label>
        <input
          id="notes-dir"
          type="text"
          class="form-input"
          data-testid="notes-dir-display"
          aria-label="ノート保存先ディレクトリ"
          bind:value={notesDir}
          placeholder="~/promptnotes"
        />
        <p class="form-hint">ノートファイル (.md) の保存先パスを指定します</p>
      </div>

      <div class="form-actions">
        <button class="save-btn" onclick={handleSave} type="button">
          {saved ? '✓ 保存しました' : '保存'}
        </button>
      </div>
    </div>
  {/if}
</main>

<style>
  .settings-page {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    max-width: 640px;
    margin: 0 auto;
    width: 100%;
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
  }

  .form-input {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    padding: 10px 12px;
    font-size: 14px;
    font-family: var(--font-mono);
    outline: none;
    transition: border-color var(--transition-fast);
  }

  .form-input:focus {
    border-color: var(--color-primary);
  }

  .form-hint {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
  }

  .save-btn {
    padding: 8px 24px;
    background: var(--color-primary);
    color: var(--color-bg);
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 500;
    transition: background var(--transition-fast);
  }

  .save-btn:hover {
    background: var(--color-primary-hover);
  }

  .loading,
  .error {
    display: flex;
    justify-content: center;
    padding: 48px;
    color: var(--color-text-muted);
  }

  .error {
    color: var(--color-danger);
  }
</style>
