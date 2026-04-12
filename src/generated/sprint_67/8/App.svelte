<!-- @traceability: design:system-design §2.3, detail:component_architecture §4.3 -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Router, { push, location } from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  import EditorView from './components/editor/EditorView.svelte';
  import GridView from './components/grid/GridView.svelte';
  import SettingsView from './components/settings/SettingsView.svelte';
  import { getConfig } from './lib/ipc';
  import { configStore } from './stores/config';

  const routes = {
    '/': EditorView,
    '/grid': GridView,
    '/settings': SettingsView,
  };

  let currentPath = '/';
  location.subscribe((loc) => { currentPath = loc; });

  onMount(async () => {
    try {
      const config = await getConfig();
      configStore.set(config);
    } catch {
      // config will use defaults
    }
  });

  function handleOpenNote(event: CustomEvent<string>) {
    push(`/?note=${event.detail}`);
  }
</script>

<div class="app">
  <nav class="nav">
    <button class="nav-btn" class:active={currentPath === '/'} on:click={() => push('/')}>
      エディタ
    </button>
    <button class="nav-btn" class:active={currentPath === '/grid'} on:click={() => push('/grid')}>
      グリッド
    </button>
    <button class="nav-btn" class:active={currentPath === '/settings'} on:click={() => push('/settings')}>
      設定
    </button>
  </nav>
  <main class="main">
    <Router {routes} on:openNote={handleOpenNote} />
  </main>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg, #fff);
    color: var(--text, #1e293b);
    --frontmatter-bg: #f0f4f8;
    --border: #e2e8f0;
    --accent: #4f46e5;
    --accent-hover: #4338ca;
    --surface: #f8fafc;
    --sidebar-bg: #f8fafc;
    --card-bg: #fff;
    --input-bg: #fff;
    --input-bg-readonly: #f8fafc;
    --hover-bg: #f1f5f9;
    --selected-bg: #e0e7ff;
    --tag-bg: #dbeafe;
    --tag-color: #1d4ed8;
    --chip-bg: #fff;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
  }
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  .nav {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border, #e2e8f0);
    background: var(--surface, #f8fafc);
    flex-shrink: 0;
  }
  .nav-btn {
    padding: 10px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary, #475569);
    transition: color 0.15s;
  }
  .nav-btn.active {
    color: var(--accent, #4f46e5);
    border-bottom-color: var(--accent, #4f46e5);
  }
  .nav-btn:hover:not(.active) {
    color: var(--text, #1e293b);
  }
  .main {
    flex: 1;
    overflow: hidden;
  }
</style>
