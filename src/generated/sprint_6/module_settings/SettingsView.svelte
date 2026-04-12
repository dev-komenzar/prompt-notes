<!-- @generated-from: docs/detailed_design/component_architecture.md §2.3, §3.1
     @sprint: 6, task: 6-1, module: settings
     Route: /settings
     Constraints:
       - Directory selection via @tauri-apps/plugin-dialog only (no direct path construction)
       - No localStorage/IndexedDB usage
       - setConfig via Rust backend only (module:settings convention) -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { configStore, initConfigStore } from './configStore';
  import { setConfig } from './ipc';
  import type { AppConfig } from './types';

  let config: AppConfig = { notes_dir: '' };
  let saving = false;
  let saveSuccess = false;
  let errorMessage = '';

  const unsubscribe = configStore.subscribe((v) => {
    config = v;
  });

  onMount(async () => {
    try {
      await initConfigStore();
    } catch (err) {
      errorMessage = `設定の読み込みに失敗しました: ${err}`;
    }
    return () => unsubscribe();
  });

  async function handleSelectDirectory() {
    errorMessage = '';
    let selected: string | string[] | null;
    try {
      selected = await open({ directory: true, multiple: false, title: '保存ディレクトリを選択' });
    } catch (err) {
      errorMessage = `ディレクトリ選択に失敗しました: ${err}`;
      return;
    }
    if (typeof selected === 'string' && selected.length > 0) {
      await persist({ notes_dir: selected });
    }
  }

  async function persist(next: AppConfig) {
    saving = true;
    saveSuccess = false;
    errorMessage = '';
    try {
      await setConfig(next);
      configStore.set(next);
      saveSuccess = true;
      setTimeout(() => { saveSuccess = false; }, 2000);
    } catch (err) {
      errorMessage = `設定の保存に失敗しました: ${err}`;
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-view">
  <h1 class="settings-title">設定</h1>

  {#if errorMessage}
    <div class="error-banner" role="alert">{errorMessage}</div>
  {/if}

  <section class="settings-section">
    <h2 class="section-title">保存ディレクトリ</h2>
    <div class="dir-row">
      <code class="dir-path">{config.notes_dir || '(デフォルト)'}</code>
      <button class="btn-change" on:click={handleSelectDirectory} disabled={saving}
              aria-busy={saving}>
        {saving ? '保存中...' : 'ディレクトリを変更'}
      </button>
    </div>
    {#if saveSuccess}
      <p class="save-success" role="status">保存しました</p>
    {/if}
    <p class="help-text">
      変更後は新しいディレクトリ内のノートのみ読み込まれます。既存ノートの移動は行われません。
    </p>
  </section>
</div>

<style>
  .settings-view {
    padding: 32px;
    max-width: 600px;
  }

  .settings-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 24px;
    color: var(--text-primary, #111);
  }

  .settings-section {
    background: var(--surface, #f8f9fa);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 8px;
    padding: 20px;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary, #111);
  }

  .dir-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .dir-path {
    flex: 1;
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--text-secondary, #4a5568);
    word-break: break-all;
    background: var(--code-bg, #edf2f7);
    padding: 4px 8px;
    border-radius: 4px;
  }

  .btn-change {
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid var(--border, #cbd5e0);
    background: var(--btn-bg, #fff);
    cursor: pointer;
    font-size: 0.875rem;
    white-space: nowrap;
    transition: background 0.15s ease;
  }

  .btn-change:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-change:hover:not(:disabled) {
    background: var(--btn-hover, #edf2f7);
  }

  .save-success {
    color: #276749;
    font-size: 0.875rem;
    margin-top: 8px;
  }

  .help-text {
    font-size: 0.8rem;
    color: var(--text-muted, #718096);
    margin-top: 12px;
    line-height: 1.5;
  }

  .error-banner {
    background: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 4px;
    padding: 12px 16px;
    color: #c53030;
    margin-bottom: 16px;
    font-size: 0.875rem;
  }
</style>
