<script lang="ts">
  import { toasts, dismissToast } from '$lib/stores';

  let items: typeof $toasts = [];
  toasts.subscribe(v => items = v);
</script>

{#if items.length > 0}
  <div class="toast-container">
    {#each items as toast (toast.id)}
      <div class="toast toast-{toast.level}" role="alert">
        <span class="toast-msg">{toast.message}</span>
        <button class="toast-close" onclick={() => dismissToast(toast.id)}>×</button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 9999;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: var(--radius);
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.2s ease-out;
  }

  .toast-error {
    background-color: var(--color-danger);
    color: #1e1e2e;
  }

  .toast-success {
    background-color: var(--color-success);
    color: #1e1e2e;
  }

  .toast-info {
    background-color: var(--color-primary);
    color: #1e1e2e;
  }

  .toast-close {
    margin-left: 12px;
    font-size: 16px;
    line-height: 1;
    opacity: 0.7;
  }

  .toast-close:hover {
    opacity: 1;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
