<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { deleteNote, forceDeleteNote, parseError } from "$lib/utils/tauri-commands";

  export let filename: string;
  const dispatch = createEventDispatcher();

  let confirmForce = false;
  let deleting = false;

  async function handleDelete() {
    if (deleting) return;
    deleting = true;
    try {
      await deleteNote(filename);
      dispatch("deleted");
    } catch (e) {
      const err = parseError(e);
      if (err.code === "TRASH_FAILED") {
        confirmForce = true;
      } else {
        console.error("Delete failed:", err);
      }
    } finally {
      deleting = false;
    }
  }

  async function handleForceDelete() {
    deleting = true;
    try {
      await forceDeleteNote(filename);
      dispatch("deleted");
    } catch (e) {
      console.error("Force delete failed:", e);
    } finally {
      deleting = false;
      confirmForce = false;
    }
  }
</script>

{#if confirmForce}
  <div class="confirm-dialog">
    <span>ゴミ箱が利用できません。完全に削除しますか？</span>
    <button class="btn-danger" on:click={handleForceDelete}>削除する</button>
    <button on:click={() => (confirmForce = false)}>キャンセル</button>
  </div>
{:else}
  <button
    class="delete-btn"
    on:click={handleDelete}
    disabled={deleting}
    aria-label="Delete note"
    title="ノートを削除"
  >Delete</button>
{/if}

<style>
  .delete-btn {
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 12px;
    background: var(--surface);
    color: var(--danger, #ef4444);
  }
  .delete-btn:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--danger, #ef4444); }
  .delete-btn:disabled { opacity: 0.5; }
  .confirm-dialog {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: var(--bg);
    border-radius: 6px;
    font-size: 13px;
  }
  .btn-danger {
    padding: 4px 12px;
    background: var(--danger);
    color: white;
    border-radius: 4px;
  }
</style>
