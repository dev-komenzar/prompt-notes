<script lang="ts">
  // @codd-trace: design:system-design § 2.8, detail:component_architecture § 2.3 (settings change flow)
  // Constraint: @tauri-apps/plugin-fs is DISABLED.  Directory selection uses plugin-dialog only.
  // Constraint: config.json write goes exclusively through invoke('set_config').

  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { getConfig, setConfig } from './ipc';
  import { configStore } from './store';
  import type { AppConfig } from './types';

  let notesDir: string = '';
  let saving = false;
  let errorMsg: string | null = null;
  let successMsg: string | null = null;
  let successTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(async () => {
    try {
      const cfg = await getConfig();
      notesDir = cfg.notes_dir;
      configStore.set(cfg);
    } catch (e) {
      errorMsg = `設定の読み込みに失敗しました: ${String(e)}`;
    }
  });

  async function handleChangeDirectory() {
    errorMsg = null;

    // @tauri-apps/plugin-dialog open() with { directory: true } does NOT require the fs plugin.
    // This is the verification point of Sprint 48: dialog plugin works while fs plugin is disabled.
    let selected: string | string[] | null;
    try {
      selected = await open({
        directory: true,
        multiple: false,
        title: 'ノート保存ディレクトリを選択',
        defaultPath: notesDir || undefined,
      });
    } catch (e) {
      errorMsg = `ディレクトリ選択に失敗しました: ${String(e)}`;
      return;
    }

    if (selected === null || Array.isArray(selected)) return;

    saving = true;
    try {
      const newConfig: AppConfig = { notes_dir: selected };
      await setConfig(newConfig);
      notesDir = selected;
      configStore.set(newConfig);
      if (successTimer) clearTimeout(successTimer);
      successMsg = 'ディレクトリを変更しました';
      successTimer = setTimeout(() => { successMsg = null; }, 3000);
    } catch (e) {
      errorMsg = `設定の保存に失敗しました: ${String(e)}`;
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-view">
  <h2>設定</h2>

  {#if errorMsg}
    <div class="banner banner--error" role="alert">{errorMsg}</div>
  {/if}
  {#if successMsg}
    <div class="banner banner--success" role="status">{successMsg}</div>
  {/if}

  <section class="settings-section">
    <h3>ノート保存ディレクトリ</h3>
    {#if notesDir}
      <div class="dir-row">
        <code class="dir-path">{notesDir}</code>
        <button
          class="btn-change"
          on:click={handleChangeDirectory}
          disabled={saving}
        >
          {saving ? '保存中...' : 'ディレクトリを変更'}
        </button>
      </div>
      <p class="dir-note">
        変更後は新しいディレクトリ内のノートのみ読み込まれます。既存ノートの移動は行われません。
      </p>
    {:else}
      <p class="loading">読み込み中...</p>
    {/if}
  </section>
</div>

<style>
  .settings-view {
    padding: 24px;
    max-width: 640px;
  }

  h2 {
    font-size: 1.4rem;
    margin: 0 0 24px;
  }

  h3 {
    font-size: 1rem;
    margin: 0 0 12px;
  }

  .settings-section {
    margin-bottom: 32px;
  }

  .dir-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .dir-path {
    flex: 1;
    padding: 8px 12px;
    background: var(--frontmatter-bg, #f0f4f8);
    border-radius: 4px;
    font-size: 0.85rem;
    word-break: break-all;
  }

  .btn-change {
    padding: 8px 16px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    font-size: 0.9rem;
  }

  .btn-change:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .btn-change:hover:not(:disabled) {
    background: #2563eb;
  }

  .dir-note {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0;
  }

  .banner {
    padding: 10px 14px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 0.9rem;
  }

  .banner--error {
    background: #fee2e2;
    color: #991b1b;
  }

  .banner--success {
    background: #d1fae5;
    color: #065f46;
  }

  .loading {
    color: #6b7280;
  }
</style>
