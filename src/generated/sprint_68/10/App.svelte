<script lang="ts">
  import { onMount } from 'svelte';
  import Router from 'svelte-spa-router';

  import { getConfig } from './lib/ipc';
  import { configStore } from './stores/config';
  import EditorView from './components/editor/EditorView.svelte';
  import GridView from './components/grid/GridView.svelte';
  import SettingsView from './components/settings/SettingsView.svelte';

  const routes = {
    '/': EditorView,
    '/grid': GridView,
    '/settings': SettingsView,
    '*': EditorView,
  };

  onMount(async () => {
    try {
      const config = await getConfig();
      configStore.set(config);
    } catch (e) {
      console.error('[App] 設定の読み込みに失敗:', e);
    }
  });
</script>

<Router {routes} />

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--text-color, #1e293b);
    background: var(--bg-color, #ffffff);
    overflow: hidden;

    --frontmatter-bg: #f0f4f8;
    --frontmatter-border: #e2e8f0;
    --border-color: #e2e8f0;
    --accent-color: #3b82f6;
    --text-color: #1e293b;
    --muted-color: #94a3b8;
    --sidebar-bg: #f8fafc;
    --card-bg: #ffffff;
    --tag-bg: #dbeafe;
    --tag-color: #1e40af;
    --item-hover-bg: #f1f5f9;
    --item-selected-bg: #eff6ff;
    --input-bg: #ffffff;
    --code-bg: #f1f5f9;
    --filter-bar-bg: #f8fafc;
    --grid-bg: #f1f5f9;
    --toast-bg: #1e293b;
  }

  @media (prefers-color-scheme: dark) {
    :global(body) {
      --frontmatter-bg: #1e293b;
      --frontmatter-border: #334155;
      --border-color: #334155;
      --text-color: #f1f5f9;
      --muted-color: #64748b;
      --sidebar-bg: #0f172a;
      --card-bg: #1e293b;
      --tag-bg: #1e3a5f;
      --tag-color: #93c5fd;
      --item-hover-bg: #1e293b;
      --item-selected-bg: #172554;
      --input-bg: #1e293b;
      --code-bg: #0f172a;
      --filter-bar-bg: #0f172a;
      --grid-bg: #0f172a;
      --bg-color: #0f172a;
      --copy-btn-bg: #3b82f6;
    }
  }
</style>
