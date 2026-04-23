<script lang="ts">
  import Header from "$lib/feed/Header.svelte";
  import Feed from "$lib/feed/Feed.svelte";
  import SettingsModal from "$lib/settings/SettingsModal.svelte";
  import StartupErrorModal from "$lib/settings/StartupErrorModal.svelte";
  import ErrorToast from "$lib/shell/ErrorToast.svelte";
  import { getStartupError } from "$lib/shell/tauri-commands";
  import { onMount } from "svelte";
  import { loadConfig } from "$lib/settings/config";
  import { setupWindowCloseHandler } from "$lib/shell/window-close";
  import { setupGlobalShortcut } from "$lib/shell/global-shortcut";

  let feedRef: { createNewNote: () => Promise<void> } | undefined = $state();
  let settingsOpen = $state(false);
  let startupError: string | null = $state(null);

  // Coalesce concurrent triggers of the new-note shortcut. The OS-level global
  // shortcut and the WebView keydown can both fire for a single Ctrl/Cmd+N
  // when the app is focused; without this guard each press would create two
  // notes.
  const NEW_NOTE_DEDUPE_MS = 200;
  let lastNewNoteAt = 0;

  function handleNewNote() {
    const now = performance.now();
    if (now - lastNewNoteAt < NEW_NOTE_DEDUPE_MS) return;
    lastNewNoteAt = now;
    void feedRef?.createNewNote();
  }

  function handleOpenSettings() {
    settingsOpen = true;
  }

  function handleCloseSettings() {
    settingsOpen = false;
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    // In-WebView counterpart of the OS global shortcut. AC-EDIT-01 requires
    // Cmd/Ctrl+N to create a new note even when only the WebView is receiving
    // the keystroke (e.g. WebDriver-injected keys, or platforms where the
    // global hook misses the chord).
    if (event.key === "n" && (event.ctrlKey || event.metaKey) && !event.altKey) {
      event.preventDefault();
      handleNewNote();
    }
  }

  onMount(async () => {
    await loadConfig();
    const err = await getStartupError();
    if (err) startupError = err;
    // Feed.svelte の $effect が filters の初期値を検知して list_notes を自動発行する
    setupWindowCloseHandler();
    await setupGlobalShortcut(handleNewNote);
  });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

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
      <SettingsModal onBack={handleCloseSettings} />
    </div>
  {/if}
  <ErrorToast />
  {#if startupError !== null}
    <StartupErrorModal
      errorMessage={startupError}
      onUseDirect={() => { startupError = null; }}
      onPickDir={() => { startupError = null; settingsOpen = true; }}
    />
  {/if}
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
