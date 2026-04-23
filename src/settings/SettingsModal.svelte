<script lang="ts">
  import { config, loadConfig, setPendingPath, setMoveExisting, applyConfigResult } from "$lib/settings/config";
  import { pickNotesDirectory, setConfig } from "$lib/shell/tauri-commands";
  import { loadNotes } from "$lib/feed/notes";
  import { handleCommandError } from "$lib/shell/error-handler";
  import { errors } from "$lib/shell/error-handler";

  interface Props {
    onBack: () => void;
  }

  let { onBack }: Props = $props();
  let saving = $state(false);
  let confirmingMove = $state(false);

  let displayPath = $derived($config.pendingPath ?? $config.notes_directory);

  let errorId = 0;

  async function handleBrowse() {
    try {
      const picked = await pickNotesDirectory();
      if (picked) {
        setPendingPath(picked);
      }
    } catch (error) {
      handleCommandError(error);
    }
  }

  function handleApplyClick() {
    if ($config.pendingPath === null) {
      onBack();
      return;
    }
    if ($config.moveExisting) {
      confirmingMove = true;
    } else {
      void applyConfig();
    }
  }

  async function applyConfig() {
    if ($config.pendingPath === null) return;
    saving = true;
    try {
      const result = await setConfig({
        notesDir: $config.pendingPath,
        moveExisting: $config.moveExisting,
      });
      applyConfigResult(result, $config.pendingPath!);
      await loadConfig();
      await loadNotes();
      if (result.remaining_in_old > 0) {
        const id = ++errorId;
        errors.update((list) => [
          ...list,
          { id, message: `古いディレクトリに ${result.remaining_in_old} 件残りました`, timestamp: Date.now() },
        ]);
        setTimeout(() => {
          errors.update((list) => list.filter((e) => e.id !== id));
        }, 5000);
      }
      onBack();
    } catch (error) {
      handleCommandError(error);
    } finally {
      saving = false;
      confirmingMove = false;
    }
  }

  function cancelMoveConfirm() {
    confirmingMove = false;
  }
</script>

<div class="settings" data-testid="settings-screen">
  <h2>Settings</h2>

  <div class="setting-group">
    <label for="notes-dir">Notes Directory</label>
    <div class="dir-input">
      <input
        id="notes-dir"
        type="text"
        value={displayPath}
        readonly
        data-testid="notes-dir-display"
        aria-label="Notes directory"
      />
      <button class="browse-btn" onclick={handleBrowse}>Browse</button>
    </div>
    {#if $config.pendingPath !== null}
      <label class="move-existing">
        <input type="checkbox" checked={$config.moveExisting} onchange={() => setMoveExisting(!$config.moveExisting)} />
        既存ノートを新ディレクトリへ移動する
      </label>
    {/if}
  </div>

  {#if confirmingMove}
    <div class="confirm-dialog" role="alertdialog">
      <p>既存ノートを新ディレクトリへ移動します。<br/>元のディレクトリからは削除され、元に戻せません。<br/>実行しますか？</p>
      <button onclick={cancelMoveConfirm} disabled={saving}>キャンセル</button>
      <button class="danger" onclick={applyConfig} disabled={saving}>実行</button>
    </div>
  {/if}

  <div class="settings-actions">
    <button class="cancel-btn" onclick={onBack}>Cancel</button>
    <button class="save-btn" onclick={handleApplyClick} disabled={saving}>
      {saving ? "Saving..." : "Apply"}
    </button>
  </div>
</div>

<style>
  .settings {
    padding: 24px;
    max-width: 600px;
    margin: 0 auto;
  }
  h2 {
    margin-bottom: 24px;
  }
  .setting-group {
    margin-bottom: 20px;
  }
  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .dir-input {
    display: flex;
    gap: 8px;
  }
  .dir-input input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface-secondary);
  }
  .browse-btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .browse-btn:hover {
    background: var(--surface-secondary);
  }
  .move-existing {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 0.85rem;
    font-weight: normal;
    cursor: pointer;
  }
  .move-existing input[type="checkbox"] {
    width: auto;
    margin: 0;
  }
  .confirm-dialog {
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .confirm-dialog p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .confirm-dialog button {
    align-self: flex-end;
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .confirm-dialog button + button {
    margin-left: 8px;
  }
  .danger {
    background: #dc2626;
    color: white;
    border-color: #dc2626 !important;
  }
  .danger:hover:not(:disabled) {
    background: #b91c1c;
  }
  .settings-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 32px;
  }
  .cancel-btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .save-btn {
    padding: 8px 16px;
    background: var(--accent);
    color: white;
    border-radius: var(--radius);
  }
  .save-btn:hover {
    background: var(--accent-hover);
  }
  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
