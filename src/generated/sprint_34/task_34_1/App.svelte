<script lang="ts">
  import EditorView from './components/editor/EditorView.svelte';
  import GridView from './components/grid/GridView.svelte';
  import SettingsView from './components/settings/SettingsView.svelte';

  type View = 'editor' | 'grid' | 'settings';
  let currentView: View = 'editor';

  function navigateToEditor(noteId: string) {
    // selectedNoteId store is already set by GridView before calling this
    currentView = 'editor';
  }

  function navigate(view: View) {
    currentView = view;
  }
</script>

<div class="app">
  <nav class="nav" aria-label="メインナビゲーション">
    <button
      class:active={currentView === 'editor'}
      on:click={() => navigate('editor')}
    >エディタ</button>
    <button
      class:active={currentView === 'grid'}
      on:click={() => navigate('grid')}
    >グリッド</button>
    <button
      class:active={currentView === 'settings'}
      on:click={() => navigate('settings')}
    >設定</button>
  </nav>

  <main class="main">
    {#if currentView === 'editor'}
      <EditorView />
    {:else if currentView === 'grid'}
      <GridView onNavigateToEditor={navigateToEditor} />
    {:else if currentView === 'settings'}
      <SettingsView />
    {/if}
  </main>
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff;
    color: #111827;
    height: 100vh;
    overflow: hidden;
  }

  :global(#app) {
    height: 100vh;
  }

  .app {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .nav {
    display: flex;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-shrink: 0;
  }

  .nav button {
    padding: 10px 20px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    color: #64748b;
    transition: all 0.15s ease;
  }

  .nav button:hover {
    color: #374151;
    background: #f1f5f9;
  }

  .nav button.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    font-weight: 500;
  }

  .main {
    flex: 1;
    overflow: hidden;
  }
</style>
