<script lang="ts">
  import { trashNote, forceDeleteNote } from "../shell/tauri-commands";
  import { removeNote } from "./notes";
  import { handleCommandError } from "../shell/error-handler";

  interface Props {
    filename: string;
  }

  let { filename }: Props = $props();
  let deleting = $state(false);
  let confirmForce = $state(false);

  async function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    if (deleting) return;
    deleting = true;
    try {
      await trashNote(filename);
      removeNote(filename);
    } catch (_trashError) {
      // AC-NAV-07.1: 通常は確認ダイアログなしで即時削除。TRASH_FAILED 時のみ
      // 完全削除の確認を取る (implementation_plan.md "TRASH_FAILED エラー時のみ確認ダイアログ表示")。
      confirmForce = true;
    } finally {
      deleting = false;
    }
  }

  async function handleForceDelete(event: MouseEvent) {
    event.stopPropagation();
    if (deleting) return;
    deleting = true;
    try {
      await forceDeleteNote(filename);
      removeNote(filename);
    } catch (forceErr) {
      handleCommandError(forceErr);
    } finally {
      deleting = false;
      confirmForce = false;
    }
  }

  function cancelForce(event: MouseEvent) {
    event.stopPropagation();
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
    data-testid="delete-button"
    onclick={handleDelete}
    disabled={deleting}
    title="ノートを削除"
  >🗑</button>
{/if}

<style>
  .delete-btn {
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background var(--transition-fast);
  }

  .delete-btn:hover:not(:disabled) {
    background: var(--surface-hover);
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
    color: #fff;
  }
  .btn-cancel:hover:not(:disabled) {
    background: var(--surface-hover);
  }
  .btn-danger:disabled,
  .btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
