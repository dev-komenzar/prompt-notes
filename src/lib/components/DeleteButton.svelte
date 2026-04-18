<script lang="ts">
  import { trashNote, forceDeleteNote } from "$lib/utils/tauri-commands";
  import { handleCommandError } from "$lib/utils/error-handler";

  interface Props {
    filename: string;
    onDeleted: () => void;
  }

  let { filename, onDeleted }: Props = $props();
  let confirming = $state(false);

  async function handleDelete() {
    if (!confirming) {
      confirming = true;
      setTimeout(() => { confirming = false; }, 3000);
      return;
    }

    try {
      await trashNote(filename);
      onDeleted();
    } catch (trashError) {
      // Fallback to permanent delete if trash not available
      try {
        await forceDeleteNote(filename);
        onDeleted();
      } catch (deleteError) {
        handleCommandError(deleteError);
      }
    }
  }
</script>

<button
  class="delete-btn"
  class:confirming
  onclick={handleDelete}
  aria-label={confirming ? "Confirm delete" : "Delete note"}
>
  {confirming ? "Confirm Delete" : "Delete"}
</button>

<style>
  .delete-btn {
    padding: 4px 10px;
    border-radius: var(--radius);
    font-size: 0.8rem;
    border: 1px solid var(--border);
    color: var(--danger);
    transition: all 0.15s;
  }
  .delete-btn:hover {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }
  .delete-btn.confirming {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }
</style>
