<!-- @generated sprint:49 task:49-1 module:settings -->
<!-- @trace detail:component_architecture §2.3 §4.6 -->
<!-- @trace design:system-design §2.3.3 -->
<!-- @convention CONV-2: config persistence via Rust backend IPC only -->
<!-- @convention CONV-4: no direct filesystem access from frontend -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import type { AppView } from './types';
  import {
    config,
    loading,
    saving,
    error,
    saveSuccess,
    pendingNotesDir,
    loadConfig,
    saveConfig,
    browseDirectory,
    resetPendingDir,
    destroySettingsStore,
  } from './settings_store';

  /**
   * Event dispatcher for navigation.
   * Settings.svelte dispatches 'navigate' with { view } payload
   * to App.svelte for SPA view switching via currentView state variable.
   */
  const dispatch = createEventDispatcher<{ navigate: { view: AppView } }>();

  /**
   * Reactive derived state: true when user has unsaved changes.
   */
  $: hasChanges = $config !== null && $pendingNotesDir !== $config.notes_dir;

  onMount(() => {
    loadConfig();
  });

  onDestroy(() => {
    destroySettingsStore();
  });

  function handleBack(): void {
    dispatch('navigate', { view: 'grid' });
  }

  async function handleSave(): Promise<void> {
    await saveConfig();
  }

  async function handleBrowse(): Promise<void> {
    await browseDirectory();
  }

  function handleReset(): void {
    resetPendingDir();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && hasChanges && !$saving) {
      handleSave();
    }
  }
</script>

<div class="settings-container">
  <header class="settings-header">
    <button
      class="back-button"
      on:click={handleBack}
      type="button"
      aria-label="グリッドビューに戻る"
    >
      ← 戻る
    </button>
    <h1 class="settings-title">設定</h1>
  </header>

  {#if $loading}
    <div class="settings-loading" role="status" aria-live="polite">
      <span>読み込み中...</span>
    </div>
  {:else}
    <section class="settings-section" aria-labelledby="dir-section-title">
      <h2 id="dir-section-title" class="section-title">保存ディレクトリ</h2>
      <p class="section-description">
        ノートファイル（.md）の保存先ディレクトリを指定します。変更後、新規ノートは新しいディレクトリに保存されます。既存ノートの自動移動は行われません。
      </p>

      <div class="directory-field">
        <label for="notes-dir-input" class="field-label">ディレクトリパス</label>
        <div class="input-row">
          <input
            id="notes-dir-input"
            type="text"
            class="directory-input"
            bind:value={$pendingNotesDir}
            on:keydown={handleKeydown}
            placeholder="/path/to/notes"
            disabled={$saving}
            aria-describedby="dir-help-text"
            spellcheck="false"
            autocomplete="off"
          />
          <button
            class="browse-button"
            on:click={handleBrowse}
            disabled={$saving}
            type="button"
            aria-label="ディレクトリ選択ダイアログを開く"
          >
            参照…
          </button>
        </div>
        <p id="dir-help-text" class="help-text">
          「参照…」ボタンでディレクトリを選択するか、パスを直接入力してください。パスの検証はバックエンドで行われます。
        </p>
      </div>

      {#if $error}
        <div class="message message--error" role="alert" aria-live="assertive">
          <span class="message-icon" aria-hidden="true">⚠</span>
          <span>{$error}</span>
        </div>
      {/if}

      {#if $saveSuccess}
        <div class="message message--success" role="status" aria-live="polite">
          <span class="message-icon" aria-hidden="true">✓</span>
          <span>設定を保存しました。</span>
        </div>
      {/if}

      <div class="button-group">
        <button
          class="btn btn--primary"
          on:click={handleSave}
          disabled={!hasChanges || $saving}
          type="button"
        >
          {#if $saving}
            保存中…
          {:else}
            保存
          {/if}
        </button>
        <button
          class="btn btn--secondary"
          on:click={handleReset}
          disabled={!hasChanges || $saving}
          type="button"
        >
          リセット
        </button>
      </div>

      {#if $config}
        <div class="current-config" aria-label="現在の設定">
          <span class="current-config-label">現在の保存先:</span>
          <code class="current-config-value">{$config.notes_dir}</code>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .settings-container {
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
    color: var(--settings-text-primary, #1a1a1a);
    line-height: 1.5;
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--settings-border, #e0e0e0);
  }

  .back-button {
    background: none;
    border: 1px solid var(--settings-border, #d0d0d0);
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    color: var(--settings-text-secondary, #555);
    transition: background-color 0.15s ease;
  }

  .back-button:hover {
    background-color: var(--settings-hover-bg, #f5f5f5);
  }

  .back-button:focus-visible {
    outline: 2px solid var(--settings-focus-ring, #3b82f6);
    outline-offset: 2px;
  }

  .settings-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }

  .settings-loading {
    display: flex;
    justify-content: center;
    padding: 48px 0;
    color: var(--settings-text-secondary, #666);
    font-size: 14px;
  }

  .settings-section {
    margin-bottom: 32px;
  }

  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px;
  }

  .section-description {
    font-size: 14px;
    color: var(--settings-text-secondary, #666);
    margin: 0 0 20px;
  }

  .directory-field {
    margin-bottom: 16px;
  }

  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--settings-text-primary, #333);
  }

  .input-row {
    display: flex;
    gap: 8px;
  }

  .directory-input {
    flex: 1;
    min-width: 0;
    padding: 8px 12px;
    border: 1px solid var(--settings-border, #d0d0d0);
    border-radius: 6px;
    font-size: 14px;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
    background-color: var(--settings-input-bg, #fff);
    color: var(--settings-text-primary, #1a1a1a);
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .directory-input:focus {
    border-color: var(--settings-focus-border, #3b82f6);
    box-shadow: 0 0 0 2px var(--settings-focus-ring-alpha, rgba(59, 130, 246, 0.2));
  }

  .directory-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .browse-button {
    flex-shrink: 0;
    padding: 8px 16px;
    border: 1px solid var(--settings-border, #d0d0d0);
    border-radius: 6px;
    background-color: var(--settings-button-bg, #f8f8f8);
    color: var(--settings-text-primary, #333);
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
    transition: background-color 0.15s ease;
  }

  .browse-button:hover:not(:disabled) {
    background-color: var(--settings-hover-bg, #e8e8e8);
  }

  .browse-button:focus-visible {
    outline: 2px solid var(--settings-focus-ring, #3b82f6);
    outline-offset: 2px;
  }

  .browse-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .help-text {
    font-size: 12px;
    color: var(--settings-text-tertiary, #999);
    margin: 6px 0 0;
  }

  .message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .message--error {
    background-color: var(--settings-error-bg, #fef2f2);
    border: 1px solid var(--settings-error-border, #fecaca);
    color: var(--settings-error-text, #991b1b);
  }

  .message--success {
    background-color: var(--settings-success-bg, #f0fdf4);
    border: 1px solid var(--settings-success-border, #bbf7d0);
    color: var(--settings-success-text, #166534);
  }

  .message-icon {
    flex-shrink: 0;
    line-height: 1;
  }

  .button-group {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .btn {
    padding: 8px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.15s ease, opacity 0.15s ease;
  }

  .btn:focus-visible {
    outline: 2px solid var(--settings-focus-ring, #3b82f6);
    outline-offset: 2px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn--primary {
    border: none;
    background-color: var(--settings-primary, #3b82f6);
    color: #fff;
  }

  .btn--primary:hover:not(:disabled) {
    background-color: var(--settings-primary-hover, #2563eb);
  }

  .btn--secondary {
    border: 1px solid var(--settings-border, #d0d0d0);
    background-color: transparent;
    color: var(--settings-text-secondary, #555);
  }

  .btn--secondary:hover:not(:disabled) {
    background-color: var(--settings-hover-bg, #f5f5f5);
  }

  .current-config {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--settings-border, #e0e0e0);
    font-size: 13px;
    color: var(--settings-text-tertiary, #888);
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .current-config-label {
    white-space: nowrap;
  }

  .current-config-value {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
    font-size: 12px;
    background-color: var(--settings-code-bg, #f4f4f5);
    padding: 2px 6px;
    border-radius: 3px;
    word-break: break-all;
  }
</style>
