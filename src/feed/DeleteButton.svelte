<script lang="ts">
  import { trashNote, forceDeleteNote } from "../shell/tauri-commands";
  import { removeNote } from "./notes";
  import { handleCommandError } from "../shell/error-handler";
  import { isTauriCommandError } from "../shell/tauri-commands";

  interface Props {
    filename: string;
  }

  let { filename }: Props = $props();
  let confirming = $state(false);

  async function handleDelete(event: MouseEvent) {
    event.stopPropagation();

    if (!confirming) {
      confirming = true;
      setTimeout(() => {
        confirming = false;
      }, 3000);
      return;
    }

    try {
      await trashNote(filename);
      removeNote(filename);
    } catch (err) {
      if (isTauriCommandError(err) && err.code === "TRASH_FAILED") {
        try {
          await forceDeleteNote(filename);
          removeNote(filename);
        } catch (forceErr) {
          handleCommandError(forceErr);
        }
      } else {
        handleCommandError(err);
      }
    }

    confirming = false;
  }
</script>

<button
  class="delete-btn"
  class:confirming
  data-testid="delete-button"
  on:click={handleDelete}
  title={confirming ? "Click again to confirm deletion" : "Delete note"}
>
  {confirming ? "Confirm?" : "🗑"}
</button>

<style>
  .delete-btn {
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: all var(--transition-fast);
  }

  .delete-btn:hover {
    background: var(--surface-hover);
  }

  .delete-btn.confirming {
    color: var(--danger);
    font-size: 11px;
    font-weight: 600;
  }

  .delete-btn.confirming:hover {
    background: var(--danger);
    color: #fff;
  }
</style>
