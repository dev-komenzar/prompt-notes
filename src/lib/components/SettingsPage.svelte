<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { getSettings, updateSettings } from '$lib/api';
  import { config, addToast } from '$lib/stores';
  import type { Config } from '$lib/types';

  let notesDir = $state('');
  let saving = $state(false);

  onMount(async () => {
    try {
      const settings = await getSettings();
      notesDir = settings.notes_dir;
      config.set(settings);
    } catch (err) {
      addToast('error', `設定の読み込みに失敗しました: ${err}`);
    }
  });

  async function chooseDirectory() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'ノートの保存先を選択'
    });
    if (selected && typeof selected === 'string') {
      notesDir = selected;
      await saveSettings();
    }
  }

  async function saveSettings() {
    saving = true;
    try {
      const newConfig: Config = { notes_dir: notesDir };
      await updateSettings(newConfig);
      config.set(newConfig);
      addToast('success', '設定を保存しました');
    } catch (err) {
      addToast('error', `設定の保存に失敗しました: ${err}`);
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-page">
  <h2 class="settings-title">Settings</h2>

  <div class="settings-section">
    <label class="settings-label" for="notes-dir-input">Notes Directory</label>
    <div class="dir-row">
      <input id="notes-dir-input" type="text" class="dir-input" value={notesDir} readonly />
      <button class="dir-btn" onclick={chooseDirectory} disabled={saving}>
        Choose...
      </button>
    </div>
    <p class="settings-hint">ノートファイルの保存先ディレクトリ</p>
  </div>
</div>

<style>
  .settings-page {
    max-width: 600px;
    margin: 0 auto;
    padding: 32px 24px;
  }

  .settings-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
    color: var(--color-text);
  }

  .settings-section {
    margin-bottom: 24px;
  }

  .settings-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }

  .dir-row {
    display: flex;
    gap: 8px;
  }

  .dir-input {
    flex: 1;
    padding: 8px 12px;
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-family: var(--font-mono);
  }

  .dir-btn {
    padding: 8px 16px;
    background-color: var(--color-bg-secondary);
    color: var(--color-text);
    border-radius: var(--radius-sm);
    font-size: 13px;
    transition: background-color 0.15s;
  }

  .dir-btn:hover:not(:disabled) {
    background-color: var(--color-border);
  }

  .dir-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .settings-hint {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 6px;
  }
</style>
