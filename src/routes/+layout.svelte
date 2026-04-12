<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import ToastContainer from '$lib/components/ToastContainer.svelte';

  let { children } = $props();
</script>

<Header />
<main class="main-content">
  {@render children()}
</main>
<ToastContainer />

<style>
  .main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
</style>
