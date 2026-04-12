<!-- @generated-from: docs/detailed_design/component_architecture.md, docs/design/system_design.md -->
<!-- @generated-by: codd implement --sprint 47 -->
<!-- module:settings — SettingsView.svelte
     Constraints enforced:
       - NO localStorage / sessionStorage / IndexedDB writes (sprint-47 verification target)
       - Directory selection via @tauri-apps/plugin-dialog only (native OS dialog)
       - Config persistence via invoke('set_config') only — Rust backend exclusive
       - Frontend path construction prohibited; path comes from OS dialog -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { getConfig, setConfig } from '$lib/ipc';
  import { configStore } from '$stores/config';
  import type { AppConfig } from '$lib/types';

  let currentConfig: AppConfig | null = null;
  let errorMessage: string | null = null;
  let successMessage: string | null = null;
  let isChanging = false;

  onMount(async () => {
    try {
      const cfg = await getConfig();
      currentConfig = cfg;
      configStore.set(cfg);
    } catch {
      errorMessage = '設定の読み込みに失敗しました';
    }
  });

  async function handleChangeDirectory(): Promise<void> {
    isChanging = true;
    errorMessage = null;
    successMessage = null;

    try {
      // Native OS directory picker — frontend never constructs or manipulates path strings
      const selected = await open({
        directory: true,
        multiple: false,
        title: '保存ディレクトリを選択',
      });

      // User cancelled or unexpected multi-select
      if (selected === null || Array.isArray(selected)) {
        return;
      }

      const newConfig: AppConfig = { notes_dir: selected };
      // Persistence exclusively via Rust backend; no browser storage is used
      await setConfig(newConfig);
      currentConfig = newConfig;
      configStore.set(newConfig);

      successMessage = 'ディレクトリを変更しました';
      setTimeout(() => { successMessage = null; }, 3000);
    } catch {
      errorMessage = 'ディレクトリの変更に失敗しました';
    } finally {
      isChanging = false;
    }
  }
</script>

<div class="settings-view">
  <h1 class="settings-title">設定</h1>

  <section class="settings-section">
    <h2 class="section-title">保存ディレクトリ</h2>

    <div class="directory-display">
      <code class="directory-path">
        {currentConfig?.notes_dir ?? '読み込み中...'}
      </code>
    </div>

    <button
      class="change-dir-btn"
      on:click={handleChangeDirectory}
      disabled={isChanging}
      type="button"
    >
      {isChanging ? '変更中...' : 'ディレクトリを変更'}
    </button>

    {#if errorMessage}
      <p class="feedback error" role="alert">{errorMessage}</p>
    {/if}
    {#if successMessage}
      <p class="feedback success" role="status">{successMessage}</p>
    {/if}

    <p class="hint">
      変更後、新しいディレクトリ内のノートのみが読み込まれます。既存ノートの移動は行われません。
    </p>
  </section>
</div>

<style>
  .settings-view {
    padding: 32px;
    max-width: 600px;
  }

  .settings-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 32px;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 4px;
  }

  .directory-display {
    background: var(--surface-secondary, #f3f4f6);
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 6px;
    padding: 12px 16px;
  }

  .directory-path {
    font-family: monospace;
    font-size: 13px;
    word-break: break-all;
    color: var(--text-primary, #111827);
  }

  .change-dir-btn {
    align-self: flex-start;
    padding: 8px 16px;
    background: var(--accent, #3b82f6);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .change-dir-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  .change-dir-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .feedback {
    font-size: 13px;
    margin: 0;
  }

  .feedback.error {
    color: var(--error, #ef4444);
  }

  .feedback.success {
    color: var(--success, #16a34a);
  }

  .hint {
    font-size: 12px;
    color: var(--text-secondary, #9ca3af);
    margin: 0;
  }
</style>
