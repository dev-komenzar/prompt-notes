<script lang="ts">
  import { onMount } from 'svelte';
  import { getSettings, updateSettings } from '../ui_foundation/api-settings';
  import type { Settings, UpdateSettingsResult } from '../ui_foundation/settings';

  let currentSettings: Settings | null = null;
  let newNotesDir = '';
  let loading = true;
  let saving = false;
  let errorMessage = '';
  let successMessage = '';

  onMount(async () => {
    try {
      currentSettings = await getSettings();
      newNotesDir = currentSettings.notes_dir;
    } catch (e) {
      errorMessage = `設定の読み込みに失敗しました: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      loading = false;
    }
  });

  function validatePath(path: string): string {
    if (!path.trim()) {
      return '保存ディレクトリを入力してください。';
    }
    return '';
  }

  async function handleSubmit() {
    errorMessage = '';
    successMessage = '';

    const clientError = validatePath(newNotesDir);
    if (clientError) {
      errorMessage = clientError;
      return;
    }

    saving = true;
    try {
      const result: UpdateSettingsResult = await updateSettings({ notes_dir: newNotesDir.trim() });
      if (result.success) {
        currentSettings = { notes_dir: newNotesDir.trim() };
        successMessage = '設定を保存しました。';
      } else {
        errorMessage = result.error ?? 'ディレクトリパスが無効です。存在するディレクトリを指定してください。';
      }
    } catch (e) {
      errorMessage = `設定の保存に失敗しました: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      saving = false;
    }
  }

  function handleInput() {
    if (errorMessage) errorMessage = '';
    if (successMessage) successMessage = '';
  }
</script>

<div class="settings-page">
  <h1>設定</h1>

  {#if loading}
    <p class="loading">読み込み中...</p>
  {:else}
    <section class="settings-section">
      <h2>保存ディレクトリ</h2>
      <p class="description">
        ノートを保存するディレクトリのパスを指定してください。<br />
        指定したディレクトリが存在しない場合はエラーになります。
      </p>

      {#if currentSettings}
        <p class="current-value">
          <span class="label">現在の設定:</span>
          <code>{currentSettings.notes_dir}</code>
        </p>
      {/if}

      <form on:submit|preventDefault={handleSubmit}>
        <label for="notes-dir-input" class="input-label">新しいディレクトリパス</label>
        <input
          id="notes-dir-input"
          type="text"
          bind:value={newNotesDir}
          on:input={handleInput}
          placeholder="/path/to/your/notes"
          class="path-input"
          class:input-error={!!errorMessage}
          disabled={saving}
          aria-describedby={errorMessage ? 'path-error' : undefined}
        />

        {#if errorMessage}
          <p id="path-error" class="error-message" role="alert">{errorMessage}</p>
        {/if}

        {#if successMessage}
          <p class="success-message" role="status">{successMessage}</p>
        {/if}

        <button
          type="submit"
          class="save-button"
          disabled={saving || newNotesDir.trim() === currentSettings?.notes_dir}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </form>
    </section>
  {/if}
</div>

<style>
  .settings-page {
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px;
    font-family: sans-serif;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 32px;
  }

  .settings-section {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 24px;
  }

  h2 {
    font-size: 1.1rem;
    margin-top: 0;
    margin-bottom: 8px;
  }

  .description {
    font-size: 0.875rem;
    color: #555;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .current-value {
    font-size: 0.875rem;
    margin-bottom: 16px;
    color: #333;
  }

  .label {
    font-weight: 600;
    margin-right: 8px;
  }

  code {
    background: #f4f4f4;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.85rem;
    word-break: break-all;
  }

  .input-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .path-input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 0.9rem;
    font-family: monospace;
    outline: none;
    transition: border-color 0.15s;
  }

  .path-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  .path-input.input-error {
    border-color: #ef4444;
  }

  .path-input:disabled {
    background: #f9f9f9;
    color: #888;
    cursor: not-allowed;
  }

  .error-message {
    margin-top: 6px;
    font-size: 0.85rem;
    color: #ef4444;
  }

  .success-message {
    margin-top: 6px;
    font-size: 0.85rem;
    color: #16a34a;
  }

  .save-button {
    margin-top: 16px;
    padding: 8px 20px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .save-button:hover:not(:disabled) {
    background: #2563eb;
  }

  .save-button:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }

  .loading {
    color: #555;
    font-size: 0.9rem;
  }
</style>
