<!-- Sprint 13 – Root application component with SPA view routing -->
<script lang="ts">
  import { onMount } from "svelte";
  import { currentView, config, addToast } from "./lib/stores";
  import { getConfig } from "./lib/api";
  import Editor from "./components/Editor.svelte";
  import GridView from "./components/GridView.svelte";
  import Settings from "./components/Settings.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import ToastContainer from "./components/ToastContainer.svelte";

  // Load config on startup
  onMount(async () => {
    try {
      const cfg = await getConfig();
      config.set(cfg);
      if (!cfg.notes_directory) {
        addToast("warning", "No notes directory configured. Please set one in Settings.");
        currentView.set("settings");
      }
    } catch (e) {
      addToast("error", `Failed to load config: ${e}`);
    }
  });
</script>

<main class="app">
  <Toolbar />
  <div class="app-content">
    {#if $currentView === "editor"}
      <Editor />
    {:else if $currentView === "grid"}
      <GridView />
    {:else if $currentView === "settings"}
      <Settings />
    {/if}
  </div>
  <ToastContainer />
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(:root) {
    --bg-primary: #1e1e2e;
    --bg-secondary: #313244;
    --bg-surface: #45475a;
    --text-primary: #cdd6f4;
    --text-secondary: #a6adc8;
    --text-muted: #6c7086;
    --accent-color: #89b4fa;
    --accent-hover: #74c7ec;
    --border-color: #585b70;
    --success-color: #a6e3a1;
    --warning-color: #f9e2af;
    --error-color: #f38ba8;
    --info-color: #89b4fa;
    --toolbar-height: 48px;
    --font-mono: "SF Mono", "Fira Code", "Cascadia Code", "JetBrains Mono", monospace;
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  :global(body) {
    font-family: var(--font-sans);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    overflow: hidden;
    height: 100vh;
    width: 100vw;
  }

  :global(#app) {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .app-content {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
</style>
