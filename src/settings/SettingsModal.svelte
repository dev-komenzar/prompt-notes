<script lang="ts">
  import {
    config,
    loadConfig,
    setPendingPath,
    setMoveExisting,
    applyConfigResult,
  } from "./config";
  import {
    pickNotesDirectory,
    setConfig,
  } from "../shell/tauri-commands";
  import { handleCommandError } from "../shell/error-handler";
  import { loadNotes } from "../feed/notes";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
  let saving = $state(false);
  let error = $state<string | null>(null);

  async function handlePickDir() {
    try {
      const dir = await pickNotesDirectory();
      if (dir) {
        setPendingPath(dir);
      }
    } catch (err) {
      handleCommandError(err);
    }
  }

  async function handleSave() {
    const pending = $config.pendingPath;
    if (!pending) return;

    saving = true;
    error = null;

    try {
      const result = await setConfig({
        notesDir: pending,
        moveExisting: $config.moveExisting,
      });
      applyConfigResult(result, pending);
      await loadNotes();
      onClose();
    } catch (err) {
      handleCommandError(err);
      error = "Failed to update settings.";
    } finally {
      saving = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="modal-overlay" data-testid="settings-modal" on:click|self={onClose}>
  <div class="modal" role="dialog" aria-label="Settings">
    <div class="modal-header">
      <h2>Settings</h2>
      <button class="modal-close" on:click={onClose}>✕</button>
    </div>

    <div class="modal-body">
      <label class="field-label">Notes Directory</label>
      <div class="dir-row">
        <input
          type="text"
          class="dir-input"
          data-testid="notes-dir-display"
          value={$config.pendingPath ?? $config.notes_directory}
          readonly
        />
        <button
          class="btn btn-secondary"
          data-testid="pick-dir-button"
          on:click={handlePickDir}
        >
          Browse…
        </button>
      </div>

      {#if $config.pendingPath}
        <label class="checkbox-label">
          <input
            type="checkbox"
            checked={$config.moveExisting}
            on:change={(e) => setMoveExisting(e.currentTarget.checked)}
          />
          Move existing notes to new directory
        </label>
      {/if}

      {#if $config.lastResult}
        <p class="result-info">
          Moved {$config.lastResult.moved_count} note(s).
          {#if $config.lastResult.remaining_in_old > 0}
            {$config.lastResult.remaining_in_old} remaining in old directory.
          {/if}
        </p>
      {/if}

      {#if error}
        <p class="error-text">{error}</p>
      {/if}
    </div>

    <div class="modal-footer">
      <button class="btn btn-secondary" on:click={onClose}>Cancel</button>
      <button
        class="btn btn-primary"
        data-testid="save-settings-button"
        disabled={!$config.pendingPath || saving}
        on:click={handleSave}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .modal {
    background: var(--surface);
    border-radius: var(--radius);
    width: 480px;
    max-width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 {
    font-size: 16px;
    font-weight: 600;
  }

  .modal-close {
    font-size: 16px;
    color: var(--text-secondary);
    padding: 4px;
  }

  .modal-body {
    padding: 20px;
  }

  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 6px;
    color: var(--text-secondary);
  }

  .dir-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .dir-input {
    flex: 1;
    font-size: 13px;
    background: var(--surface-hover);
    cursor: default;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 12px;
  }

  .result-info {
    font-size: 12px;
    color: var(--success);
    margin-bottom: 8px;
  }

  .error-text {
    font-size: 12px;
    color: var(--danger);
    margin-bottom: 8px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
  }

  .btn {
    padding: 6px 14px;
    border-radius: var(--radius);
    font-size: 13px;
    transition: background var(--transition-fast);
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: var(--surface-hover);
  }
</style>
