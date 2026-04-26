<script lang="ts">
  import { onMount } from "svelte";
  import Header from "./feed/Header.svelte";
  import Feed from "./feed/Feed.svelte";
  import SettingsModal from "./settings/SettingsModal.svelte";
  import StartupErrorModal from "./settings/StartupErrorModal.svelte";
  import ErrorToast from "./shell/ErrorToast.svelte";
  import { loadNotes, prependNote } from "./feed/notes";
  import { loadConfig } from "./settings/config";
  import { setupGlobalShortcut } from "./shell/global-shortcut";
  import { createNote } from "./shell/tauri-commands";
  import { getStartupError } from "./shell/tauri-commands";
  import { handleCommandError } from "./shell/error-handler";

  let settingsOpen = $state(false);
  let startupError = $state<string | null>(null);
  let editingFilename = $state<string | null>(null);

  async function handleNewNote() {
    try {
      const note = await createNote([]);
      prependNote(note);
      editingFilename = note.filename;
    } catch (err) {
      handleCommandError(err);
    }
  }

  onMount(async () => {
    await loadConfig();
    await loadNotes();
    setupGlobalShortcut(handleNewNote);

    try {
      const err = await getStartupError();
      if (err) startupError = err;
    } catch (_e) {
      // ignore
    }
  });
</script>

<Header
  onNewNote={handleNewNote}
  onOpenSettings={() => (settingsOpen = true)}
/>
<Feed bind:editingFilename />
<ErrorToast />

{#if settingsOpen}
  <SettingsModal onClose={() => (settingsOpen = false)} />
{/if}

{#if startupError}
  <StartupErrorModal
    message={startupError}
    onClose={() => (startupError = null)}
  />
{/if}

<style>
  :global(body) {
    overflow: hidden;
  }
</style>
