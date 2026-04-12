<!-- @generated-from: docs/design/system_design.md §2.3 -->
<!-- Hash-based SPA routing for Tauri WebView: /, /grid, /settings -->
<script lang="ts">
  import { onMount } from 'svelte';
  import EditorView from './components/editor/EditorView.svelte';
  import GridView from './components/grid/GridView.svelte';
  import SettingsView from './components/settings/SettingsView.svelte';
  import { configStore } from './stores/config';
  import { selectedNoteId } from './stores/notes';
  import { getConfig } from './lib/ipc';

  let currentPath = '/';

  function parseHash(): { path: string; noteId: string | null } {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    const params = new URLSearchParams(qs ?? '');
    return { path: path || '/', noteId: params.get('note') };
  }

  function onHashChange(): void {
    const { path, noteId } = parseHash();
    currentPath = path;
    if (noteId) selectedNoteId.set(noteId);
  }

  onMount(async () => {
    try {
      const cfg = await getConfig();
      configStore.set(cfg);
    } catch {
      // Rust backend will use platform default; non-fatal
    }
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });
</script>

<div class="app">
  <div class="route">
    {#if currentPath === '/grid'}
      <GridView />
    {:else if currentPath === '/settings'}
      <SettingsView />
    {:else}
      <EditorView />
    {/if}
  </div>
  <nav class="nav-bar" aria-label="メインナビゲーション">
    <a href="#/" class="nav-link" class:active={currentPath === '/'}>エディタ</a>
    <a href="#/grid" class="nav-link" class:active={currentPath === '/grid'}>グリッド</a>
    <a href="#/settings" class="nav-link" class:active={currentPath === '/settings'}>設定</a>
  </nav>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; }
  :global(body) {
    margin: 0; padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  :global(:root) {
    --frontmatter-bg: #f0f4f8;
    --border-color: #e2e8f0;
    --accent-color: #4299e1;
  }

  .app { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .route { flex: 1; overflow: hidden; }

  .nav-bar {
    display: flex; gap: 4px;
    padding: 6px 16px;
    border-top: 1px solid #e2e8f0;
    background: #f7fafc;
    flex-shrink: 0;
  }
  .nav-link {
    text-decoration: none; color: #718096;
    font-size: 13px; padding: 4px 10px; border-radius: 4px;
    transition: color 0.15s, background 0.15s;
  }
  .nav-link:hover { color: #2d3748; background: #edf2f7; }
  .nav-link.active { color: #4299e1; font-weight: 600; }
</style>
