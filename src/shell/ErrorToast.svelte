<script lang="ts">
  import { errors, dismissError } from "./error-handler";
</script>

{#if $errors.length > 0}
  <div class="toast-container" data-testid="error-toast-container">
    {#each $errors as err (err.id)}
      <div class="toast" data-testid="error-toast">
        <span class="toast-message">{err.message}</span>
        <button
          class="toast-dismiss"
          on:click={() => dismissError(err.id)}
          title="Dismiss"
        >
          ✕
        </button>
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
    z-index: 300;
    max-width: 360px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--danger);
    color: #fff;
    border-radius: var(--radius);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    font-size: 13px;
    animation: slideIn 200ms ease;
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

  .toast-message {
    flex: 1;
  }

  .toast-dismiss {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    padding: 2px;
  }

  .toast-dismiss:hover {
    color: #fff;
  }
</style>
