<script lang="ts">
  export let getContent: () => string;

  let copied = false;
  let errorFlash = false;

  async function handleCopy() {
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      errorFlash = true;
      setTimeout(() => {
        errorFlash = false;
      }, 500);
    }
  }
</script>

<button
  class="copy-button"
  class:copied
  class:error={errorFlash}
  on:click={handleCopy}
  aria-label={copied ? 'コピーしました' : '本文をコピー'}
  title={copied ? 'コピーしました' : '本文をコピー'}
>
  {#if copied}
    <span class="icon">✓</span>
  {:else if errorFlash}
    <span class="icon">✗</span>
  {:else}
    <span class="icon">📋</span>
  {/if}
</button>

<style>
  .copy-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 100;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background-color: #4a5568;
    color: #ffffff;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: background-color 0.15s ease, transform 0.1s ease;
  }

  .copy-button:hover {
    background-color: #2d3748;
    transform: scale(1.05);
  }

  .copy-button:active {
    transform: scale(0.95);
  }

  .copy-button.copied {
    background-color: #38a169;
  }

  .copy-button.error {
    background-color: #e53e3e;
  }

  .icon {
    line-height: 1;
    user-select: none;
  }
</style>
