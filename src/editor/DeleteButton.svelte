<script lang="ts">
  import { trashNote, forceDeleteNote } from "$lib/shell/tauri-commands";
  import { handleCommandError } from "$lib/shell/error-handler";

  interface Props {
    filename: string;
    onDeleted: () => void;
  }

  let { filename, onDeleted }: Props = $props();
  let deleting = $state(false);
  let confirmForce = $state(false);

  async function handleDelete() {
    if (deleting) return;
    deleting = true;
    try {
      await trashNote(filename);
      onDeleted();
    } catch (trashError) {
      confirmForce = true;
    } finally {
      deleting = false;
    }
  }

  async function handleForceDelete() {
    if (deleting) return;
    deleting = true;
    try {
      await forceDeleteNote(filename);
      onDeleted();
    } catch (error) {
      handleCommandError(error);
    } finally {
      deleting = false;
      confirmForce = false;
    }
  }

  function cancelForce() {
    confirmForce = false;
  }
</script>

{#if confirmForce}
  <div class="confirm-dialog" role="alertdialog" aria-label="Confirm permanent delete">
    <span class="confirm-message">ゴミ箱が利用できません。完全に削除しますか？</span>
    <button
      class="btn-danger"
      onclick={handleForceDelete}
      disabled={deleting}
      data-testid="force-delete-confirm"
    >削除する</button>
    <button
      class="btn-cancel"
      onclick={cancelForce}
      disabled={deleting}
      data-testid="force-delete-cancel"
    >キャンセル</button>
  </div>
{:else}
  <button
    class="delete-btn"
    onclick={handleDelete}
    disabled={deleting}
    aria-label="Delete note"
    title="ノートを削除"
    data-testid="delete-button"
  >Delete</button>
{/if}

<style>
  .delete-btn {
    padding: 4px 10px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--danger);
    transition: all 0.15s;
  }
  .delete-btn:hover:not(:disabled) {
    background: var(--surface-secondary);
    border-color: var(--danger);
  }
  .delete-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .confirm-dialog {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 4px 8px;
    border: 1px solid var(--danger);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .confirm-message {
    font-size: 0.8rem;
    color: var(--text);
  }
  .btn-danger,
  .btn-cancel {
    padding: 4px 10px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .btn-danger {
    color: var(--danger);
    border-color: var(--danger);
  }
  .btn-danger:hover:not(:disabled) {
    background: var(--danger);
    color: white;
  }
  .btn-cancel:hover:not(:disabled) {
    background: var(--surface-secondary);
  }
  .btn-danger:disabled,
  .btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
