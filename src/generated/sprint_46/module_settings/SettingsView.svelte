<script lang="ts">
  import { onMount } from 'svelte';
  import { open } from '@tauri-apps/plugin-dialog';
  import { getConfig, setConfig } from '../../../lib/ipc';
  import { configStore } from '../../../stores/config';
  import type { AppConfig } from '../../../lib/types';

  let currentConfig: AppConfig | null = null;
  let loading = false;
  let saving = false;
  let errorMessage: string | null = null;
  let successMessage: string | null = null;

  onMount(async () => {
    loading = true;
    try {
      currentConfig = await getConfig();
      configStore.set(currentConfig);
    } catch (e) {
      errorMessage = 'Failed to load configuration.';
    } finally {
      loading = false;
    }
  });

  async function handleSelectDirectory() {
    errorMessage = null;
    successMessage = null;

    let selected: string | string[] | null;
    try {
      selected = await open({ directory: true, multiple: false });
    } catch (e) {
      errorMessage = 'Directory selection failed.';
      return;
    }

    if (selected === null || Array.isArray(selected)) {
      return;
    }

    const newConfig: AppConfig = { notes_dir: selected };
    saving = true;
    try {
      await setConfig(newConfig);
      currentConfig = newConfig;
      configStore.set(newConfig);
      successMessage = 'Save directory updated successfully.';
      setTimeout(() => { successMessage = null; }, 3000);
    } catch (e) {
      errorMessage = 'Failed to save configuration.';
    } finally {
      saving = false;
    }
  }
</script>

<div class="settings-view">
  <h1 class="settings-title">Settings</h1>

  <section class="settings-section">
    <h2 class="section-title">Save Directory</h2>

    {#if loading}
      <p class="status-text">Loading...</p>
    {:else}
      <div class="dir-display">
        <span class="dir-label">Current directory:</span>
        <code class="dir-path">{currentConfig?.notes_dir ?? '—'}</code>
      </div>

      <button
        class="change-btn"
        on:click={handleSelectDirectory}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Change Directory'}
      </button>

      {#if successMessage}
        <p class="message success">{successMessage}</p>
      {/if}

      {#if errorMessage}
        <p class="message error">{errorMessage}</p>
      {/if}

      <p class="note">
        Existing notes in the previous directory are not moved.
        Only notes in the new directory will be loaded.
      </p>
    {/if}
  </section>
</div>

<style>
  .settings-view {
    padding: 32px;
    max-width: 640px;
  }

  .settings-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 24px;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 4px;
  }

  .dir-display {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dir-label {
    font-size: 0.875rem;
    color: var(--text-muted, #6b7280);
  }

  .dir-path {
    font-family: monospace;
    font-size: 0.875rem;
    background: var(--code-bg, #f3f4f6);
    padding: 6px 10px;
    border-radius: 4px;
    word-break: break-all;
  }

  .change-btn {
    align-self: flex-start;
    padding: 8px 16px;
    background: var(--accent, #3b82f6);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .change-btn:hover:not(:disabled) {
    opacity: 0.85;
  }

  .change-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .message {
    font-size: 0.875rem;
    margin: 0;
    padding: 8px 12px;
    border-radius: 4px;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
  }

  .note {
    font-size: 0.8125rem;
    color: var(--text-muted, #6b7280);
    margin: 0;
  }
</style>
