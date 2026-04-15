<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { saveNote } from "$lib/utils/tauri-commands";
  import Header from "$lib/components/Header.svelte";
  import Feed from "$lib/components/Feed.svelte";
  import SettingsModal from "$lib/components/SettingsModal.svelte";
  import type { NoteMetadata } from "$lib/utils/tauri-commands";

  let settingsOpen = false;
  let feed: Feed;
  let unlistenClose: (() => void) | null = null;

  // Track active editor for window-close save
  let activeFilename: string | null = null;
  let getActiveContent: (() => string) | null = null;

  export function registerEditor(filename: string, getContent: () => string) {
    activeFilename = filename;
    getActiveContent = getContent;
  }

  export function unregisterEditor() {
    activeFilename = null;
    getActiveContent = null;
  }

  onMount(async () => {
    unlistenClose = await listen("before-close", async () => {
      if (activeFilename && getActiveContent) {
        try {
          await saveNote(activeFilename, getActiveContent());
        } catch (e) {
          console.error("Failed to save on close:", e);
        }
      }
      await getCurrentWindow().destroy();
    });
  });

  onDestroy(() => {
    unlistenClose?.();
  });

  function handleNewNote(e: CustomEvent<NoteMetadata>) {
    feed?.handleNewNote(e.detail);
  }
</script>

<div class="app">
  <Header on:newNote={handleNewNote} on:openSettings={() => (settingsOpen = true)} />
  <Feed bind:this={feed} {registerEditor} {unregisterEditor} />
  {#if settingsOpen}
    <SettingsModal on:close={() => (settingsOpen = false)} />
  {/if}
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
</style>
