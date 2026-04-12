<!-- @generated-from: docs/plan/implementation_plan.md sprint:15 task:15-1 -->
<!-- @generated-by: codd implement --sprint 15 -->
<script lang="ts">
  import Router from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  import { onMount } from 'svelte';
  import { configStore } from './stores/config';
  import { getConfig } from './lib/ipc';

  const routes = {
    '/': wrap({
      asyncComponent: () => import('../../components/editor/EditorView.svelte'),
    }),
    '/grid': wrap({
      asyncComponent: () => import('../../components/grid/GridView.svelte'),
    }),
    '/settings': wrap({
      asyncComponent: () => import('../../components/settings/SettingsView.svelte'),
    }),
  };

  onMount(async () => {
    try {
      const config = await getConfig();
      configStore.set(config);
    } catch (err) {
      console.error('Failed to load config on startup:', err);
    }
  });

  function routeNotFound() {
    console.warn('Route not found, staying on current route');
  }
</script>

<Router {routes} on:routeEvent={routeNotFound} />
