<script lang="ts">
  import Header from "$lib/components/Header.svelte";
  import Feed from "$lib/components/Feed.svelte";
  import NoteEditor from "$lib/components/NoteEditor.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import ErrorToast from "$lib/components/ErrorToast.svelte";
  import { onMount } from "svelte";
  import { loadConfig } from "$lib/stores/config";
  import { loadNotes } from "$lib/stores/notes";
  import { setupWindowCloseHandler } from "$lib/utils/window-close";
  import { setupGlobalShortcut } from "$lib/utils/global-shortcut";

  let currentView: "feed" | "editor" | "settings" = $state("feed");
  let editingFilename: string | null = $state(null);

  function handleOpenNote(filename: string) {
    editingFilename = filename;
    currentView = "editor";
  }

  function handleNewNote() {
    editingFilename = null;
    currentView = "editor";
  }

  function handleBack() {
    currentView = "feed";
    editingFilename = null;
  }

  function handleOpenSettings() {
    currentView = "settings";
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
    onBack={currentView !== "feed" ? handleBack : undefined}
    showBack={currentView !== "feed"}
  />
  <main class="app-main">
    {#if currentView === "feed"}
      <Feed onOpenNote={handleOpenNote} />
    {:else if currentView === "editor"}
      <NoteEditor filename={editingFilename} onBack={handleBack} />
    {:else if currentView === "settings"}
      <Settings onBack={handleBack} />
    {/if}
  </main>
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
</style>
