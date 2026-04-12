<!-- @generated-from: docs/design/system_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import Router from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import EditorView from './components/editor/EditorView.svelte';
  import GridView from './components/grid/GridView.svelte';
  import SettingsView from './components/settings/SettingsView.svelte';
  import { getConfig } from './lib/ipc';
  import { configStore } from './stores/config';
  import { push } from 'svelte-spa-router';

  const routes = {
    '/': EditorView,
    '/grid': GridView,
    '/settings': SettingsView,
  };

  onMount(async () => {
    try {
      const config = await getConfig();
      configStore.set(config);
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  });
</script>

<div class="app">
  <Router {routes} />
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--page-bg, #f7fafc);
    color: var(--text, #2d3748);
    overflow: hidden;
  }

  :global(:root) {
    --frontmatter-bg: #f0f4f8;
    --border-color: #e2e8f0;
    --sidebar-bg: #f7fafc;
    --hover-bg: #edf2f7;
    --active-bg: #ebf8ff;
    --accent: #4299e1;
    --accent-dark: #3182ce;
    --muted: #718096;
    --text: #2d3748;
    --card-bg: #ffffff;
    --tag-bg: #bee3f8;
    --tag-color: #2b6cb0;
    --nav-bg: #2d3748;
    --page-bg: #f7fafc;
    --input-bg: #ffffff;
    --input-bg-readonly: #f7fafc;
    --chip-bg: #ffffff;
    --btn-bg: #4a5568;
    --btn-hover-bg: #2d3748;
    --placeholder: #a0aec0;
  }

  .app {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
</style>
