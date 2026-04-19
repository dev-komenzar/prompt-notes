<script lang="ts">
  import Header from "$lib/components/Header.svelte";
  import Feed from "$lib/components/Feed.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import ErrorToast from "$lib/components/ErrorToast.svelte";
  import { onMount } from "svelte";
  import { loadConfig } from "$lib/stores/config";
  import { loadNotes } from "$lib/stores/notes";
  import { setupWindowCloseHandler } from "$lib/utils/window-close";
  import { setupGlobalShortcut } from "$lib/utils/global-shortcut";

  let feedRef: { createNewNote: () => Promise<void> } | undefined = $state();
  let settingsOpen = $state(false);

  function handleNewNote() {
    void feedRef?.createNewNote();
  }

  function handleOpenSettings() {
    settingsOpen = true;
  }

  function handleCloseSettings() {
    settingsOpen = false;
  }

  onMount(async () => {
    await loadConfig();
    await loadNotes();
    setupWindowCloseHandler();
    setupGlobalShortcut(handleNewNote);
  });
</script>

<div class="app-container">
  <Header
    onNewNote={handleNewNote}
    onOpenSettings={handleOpenSettings}
  />
  <main class="app-main">
    <Feed bind:this={feedRef} />
  </main>
  {#if settingsOpen}
    <div class="settings-overlay" role="dialog" aria-modal="true" aria-label="Settings">
      <Settings onBack={handleCloseSettings} />
    </div>
  {/if}
  <ErrorToast />
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--surface);
    color: var(--text);
  }
  .app-main {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .settings-overlay {
    position: fixed;
    inset: 0;
    background: var(--surface);
    z-index: 100;
    overflow-y: auto;
  }
</style>
