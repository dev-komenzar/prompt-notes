<!-- @traceability: design:system-design §2.8, detail:component_architecture §2.3 -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { getConfig, setConfig } from '../../lib/ipc';
  import { configStore } from '../../stores/config';

  let notesDir = '';
  let message: { text: string; type: 'success' | 'error' } | null = null;

  onMount(async () => {
    try {
      const config = await getConfig();
      configStore.set(config);
      notesDir = config.notes_dir;
    } catch {
      message = { text: '設定の読み込みに失敗しました。', type: 'error' };
    }
  });

  async function handleSelectDir() {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === 'string') {
        notesDir = selected;
      }
    } catch {
      message = { text: 'ディレクトリの選択に失敗しました。', type: 'error' };
    }
  }

  async function handleSave() {
    try {
      const config = { notes_dir: notesDir };
      await setConfig(config);
      configStore.set(config);
      message = { text: '保存しました。', type: 'success' };
      setTimeout(() => { message = null; }, 3000);
    } catch {
      message = { text: '設定の保存に失敗しました。', type: 'error' };
    }
  }
</script>

<div class="settings-view">
  <h2>設定</h2>

  {#if message}
    <div class="message" class:success={message.type === 'success'} class:error={message.type === 'error'}>
      {message.text}
    </div>
  {/if}

  <section class="setting-section">
    <label class="setting-label" for="notes-dir">ノート保存ディレクトリ</label>
    <div class="dir-input-row">
      <input
        id="notes-dir"
        type="text"
        class="dir-input"
        bind:value={notesDir}
        readonly
        placeholder="ディレクトリを選択してください"
      />
      <button class="browse-btn" on:click={handleSelectDir}>参照...</button>
    </div>
    <p class="hint">
      既存ノートは移動されません。変更後は新しいディレクトリのノートのみ読み込まれます。
    </p>
  </section>

  <button class="save-btn" on:click={handleSave} disabled={!notesDir}>
    保存
  </button>
</div>

<style>
  .settings-view {
    max-width: 600px;
    margin: 0 auto;
    padding: 32px 24px;
  }
  h2 {
    font-size: 20px;
    margin-bottom: 24px;
    color: var(--text, #1e293b);
  }
  .message {
    padding: 10px 14px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 13px;
  }
  .message.success {
    background: #dcfce7;
    color: #16a34a;
  }
  .message.error {
    background: #fee2e2;
    color: #dc2626;
  }
  .setting-section {
    margin-bottom: 24px;
  }
  .setting-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text, #1e293b);
    margin-bottom: 8px;
  }
  .dir-input-row {
    display: flex;
    gap: 8px;
  }
  .dir-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 6px;
    font-size: 13px;
    background: var(--input-bg-readonly, #f8fafc);
    color: var(--text, #1e293b);
    cursor: default;
  }
  .browse-btn {
    padding: 8px 16px;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 6px;
    background: var(--surface, #fff);
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .browse-btn:hover {
    background: var(--hover-bg, #f1f5f9);
  }
  .hint {
    font-size: 12px;
    color: var(--text-muted, #94a3b8);
    margin-top: 6px;
  }
  .save-btn {
    padding: 10px 24px;
    background: var(--accent, #4f46e5);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .save-btn:hover:not(:disabled) {
    background: var(--accent-hover, #4338ca);
  }
  .save-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
