<!-- CoDD Trace: plan:implementation_plan > sprint:52 > task:52-1 -->
<!-- Module: App — Root component with currentView conditional rendering (3 screens, no SPA router) -->
<!-- Screen transitions: grid ↔ editor, grid ↔ settings -->
<script lang="ts">
  import { currentView } from './lib/stores';
  import Editor from './components/editor/Editor.svelte';
  import GridView from './components/grid/GridView.svelte';
  import Settings from './components/settings/Settings.svelte';
</script>

<div class="app-root">
  {#if $currentView === 'grid'}
    <GridView />
  {:else if $currentView === 'editor'}
    <Editor />
  {:else if $currentView === 'settings'}
    <Settings />
  {/if}
</div>

<style>
  :global(:root) {
    --primary-color: #3b82f6;
    --primary-dark: #2563eb;
    --primary-hover-bg: rgba(59, 130, 246, 0.08);
    --success-color: #22c55e;
    --error-color: #ef4444;
    --text-color: #0f172a;
    --text-muted: #94a3b8;
    --border-color: #e2e8f0;
    --hover-bg: #f1f5f9;
    --active-bg: #e2e8f0;
    --card-bg: #ffffff;
    --input-bg: #ffffff;
    --toolbar-bg: #ffffff;
    --header-bg: #ffffff;
    --editor-bg: #ffffff;
    --grid-bg: #f8fafc;
    --settings-bg: #f8fafc;
    --tag-bg: rgba(59, 130, 246, 0.1);
    --tag-color: #3b82f6;
    --frontmatter-bg: rgba(59, 130, 246, 0.08);
    --editor-gutter-bg: #f8fafc;
    --editor-gutter-color: #94a3b8;
    --editor-active-line-bg: rgba(59, 130, 246, 0.04);
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --primary-color: #60a5fa;
      --primary-dark: #3b82f6;
      --primary-hover-bg: rgba(96, 165, 250, 0.12);
      --success-color: #4ade80;
      --error-color: #f87171;
      --text-color: #e2e8f0;
      --text-muted: #64748b;
      --border-color: #334155;
      --hover-bg: #1e293b;
      --active-bg: #334155;
      --card-bg: #1e293b;
      --input-bg: #1e293b;
      --toolbar-bg: #0f172a;
      --header-bg: #0f172a;
      --editor-bg: #0f172a;
      --grid-bg: #0f172a;
      --settings-bg: #0f172a;
      --tag-bg: rgba(96, 165, 250, 0.15);
      --tag-color: #60a5fa;
      --frontmatter-bg: rgba(96, 165, 250, 0.1);
      --editor-gutter-bg: #0f172a;
      --editor-gutter-color: #475569;
      --editor-active-line-bg: rgba(96, 165, 250, 0.06);
    }
  }

  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica,
      Arial, sans-serif;
    background-color: var(--editor-bg);
    color: var(--text-color);
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .app-root {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
</style>
