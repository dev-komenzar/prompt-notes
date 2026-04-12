<script lang="ts">
  export let getContent: () => string;

  let copied = false;
  let errorState = false;

  async function handleCopy() {
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => { copied = false; }, 1500);
    } catch {
      errorState = true;
      setTimeout(() => { errorState = false; }, 500);
    }
  }
</script>

<button
  class="copy-btn"
  class:copied
  class:error={errorState}
  on:click={handleCopy}
  title="本文をクリップボードにコピー"
  aria-label="本文をクリップボードにコピー"
>
  {#if copied}
    ✓
  {:else}
    📋
  {/if}
</button>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--copy-btn-bg, #3b82f6);
    color: white;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    transition: background 0.2s, transform 0.1s;
    z-index: 100;
  }

  .copy-btn:hover {
    background: #2563eb;
    transform: scale(1.05);
  }

  .copy-btn:active {
    transform: scale(0.95);
  }

  .copy-btn.copied {
    background: #22c55e;
  }

  .copy-btn.error {
    background: #ef4444;
  }
</style>
