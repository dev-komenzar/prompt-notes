<script lang="ts">
  import { onMount } from 'svelte';
  import { getSettings, updateSettings } from './api-settings';

  let notesDir = '';
  let inputValue = '';
  let errorMessage = '';
  let successMessage = '';
  let loading = true;
  let saving = false;

  onMount(async () => {
    try {
      const settings = await getSettings();
      notesDir = settings.notes_dir;
      inputValue = settings.notes_dir;
    } catch (e) {
      errorMessage = `設定の読み込みに失敗しました: ${e}`;
    } finally {
      loading = false;
    }
  });

  async function handleSave() {
    errorMessage = '';
    successMessage = '';
    saving = true;
    try {
      await updateSettings(inputValue);
      notesDir = inputValue;
      successMessage = '保存しました';
    } catch (e) {
      errorMessage = typeof e === 'string' ? e : `保存に失敗しました: ${e}`;
    } finally {
      saving = false;
    }
  }

  function handleReset() {
    inputValue = notesDir;
    errorMessage = '';
    successMessage = '';
  }

  $: isDirty = inputValue !== notesDir;
</script>

<div class="settings-page">
  <h1 class="settings-title">設定</h1>

  {#if loading}
    <p class="loading-text">読み込み中...</p>
  {:else}
    <section class="settings-section">
      <label class="field-label" for="notes-dir-input">
        保存ディレクトリ
      </label>
      <p class="field-description">
        ノートファイル（.md）を保存するディレクトリを指定します。
      </p>
      <div class="input-row">
        <input
          id="notes-dir-input"
          class="dir-input"
          type="text"
          bind:value={inputValue}
          placeholder="/path/to/notes"
          disabled={saving}
          aria-describedby={errorMessage ? 'notes-dir-error' : undefined}
          aria-invalid={!!errorMessage}
        />
      </div>

      {#if errorMessage}
        <p id="notes-dir-error" class="error-message" role="alert">
          {errorMessage}
        </p>
      {/if}

      {#if successMessage}
        <p class="success-message" role="status">
          {successMessage}
        </p>
      {/if}

      <div class="button-row">
        <button
          class="btn-save"
          on:click={handleSave}
          disabled={saving || !isDirty || inputValue.trim() === ''}
        >
          {saving ? '保存中...' : '保存'}
        </button>
        {#if isDirty}
          <button
            class="btn-reset"
            on:click={handleReset}
            disabled={saving}
          >
            元に戻す
          </button>
        {/if}
      </div>
    </section>
  {/if}
</div>

<style>
  .settings-page {
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px;
    font-family: system-ui, sans-serif;
  }

  .settings-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 32px 0;
    color: #1a1a1a;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .field-description {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0;
  }

  .input-row {
    display: flex;
    gap: 8px;
  }

  .dir-input {
    flex: 1;
    padding: 8px 12px;
    font-size: 0.875rem;
    font-family: monospace;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: #111827;
    outline: none;
    transition: border-color 0.15s;
  }

  .dir-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .dir-input:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  .dir-input[aria-invalid='true'] {
    border-color: #ef4444;
  }

  .error-message {
    font-size: 0.8125rem;
    color: #ef4444;
    margin: 0;
  }

  .success-message {
    font-size: 0.8125rem;
    color: #16a34a;
    margin: 0;
  }

  .button-row {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .btn-save {
    padding: 8px 20px;
    font-size: 0.875rem;
    font-weight: 500;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-save:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn-save:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }

  .btn-reset {
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .btn-reset:hover:not(:disabled) {
    color: #374151;
    border-color: #9ca3af;
  }

  .btn-reset:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-text {
    color: #6b7280;
    font-size: 0.875rem;
  }
</style>
