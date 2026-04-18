<script lang="ts">
  import { errors, dismissError } from "$lib/utils/error-handler";
</script>

{#if $errors.length > 0}
  <div class="error-toast-container">
    {#each $errors as error (error.id)}
      <div class="error-toast" role="alert">
        <span class="error-message">{error.message}</span>
        <button
          class="error-dismiss"
          onclick={() => dismissError(error.id)}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .error-toast-container {
    position: fixed;
    bottom: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 1000;
    max-width: 400px;
  }
  .error-toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    background: var(--danger);
    color: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    animation: slideIn 0.2s ease-out;
  }
  .error-message {
    font-size: 0.875rem;
  }
  .error-dismiss {
    color: white;
    font-size: 1.2rem;
    line-height: 1;
    opacity: 0.8;
  }
  .error-dismiss:hover {
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
