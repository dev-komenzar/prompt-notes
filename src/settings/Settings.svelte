<script lang="ts">
  import { config, saveConfig, loadConfig } from "$lib/settings/config";
  import { moveNotes } from "$lib/shell/tauri-commands";
  import { loadNotes } from "$lib/feed/notes";
  import { handleCommandError } from "$lib/shell/error-handler";
  import { open } from "@tauri-apps/plugin-dialog";

  interface Props {
    onBack: () => void;
  }

  let { onBack }: Props = $props();
  let notesDir = $state($config.notes_directory);
  let saving = $state(false);

  async function handleBrowse() {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") {
      notesDir = selected;
    }
  }

  async function handleSave() {
    if (notesDir === $config.notes_directory) {
      onBack();
      return;
    }

    saving = true;
    try {
      const oldDir = $config.notes_directory;
      // Move existing notes to new directory
      if (oldDir) {
        await moveNotes(oldDir, notesDir);
      }
      await saveConfig({ notes_directory: notesDir });
      await loadNotes();
      onBack();
    } catch (error) {
      handleCommandError(error);
    } finally {
      saving = false;
    }
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
        bind:value={notesDir}
        readonly
        data-testid="notes-dir-display"
        aria-label="Notes directory"
      />
      <button class="browse-btn" onclick={handleBrowse}>Browse</button>
    </div>
  </div>

  <div class="settings-actions">
    <button class="cancel-btn" onclick={onBack}>Cancel</button>
    <button class="save-btn" onclick={handleSave} disabled={saving}>
      {saving ? "Saving..." : "Save"}
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
