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
  class="copy-btn"
  class:copied
  class:error={errorFlash}
  on:click={handleCopy}
  title="本文をコピー"
  aria-label="本文をクリップボードにコピー"
>
  {#if copied}✓{:else}📋{/if}
</button>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #3b82f6;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    transition: background 0.15s ease;
    z-index: 100;
  }

  .copy-btn:hover {
    background: #2563eb;
  }

  .copy-btn.copied {
    background: #22c55e;
  }

  .copy-btn.error {
    background: #ef4444;
  }
</style>
