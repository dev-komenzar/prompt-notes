<script lang="ts">
  import type { EditorView } from '@codemirror/view';

  export let editorView: EditorView;

  let copied = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function extractBody(doc: string): string {
    const match = doc.match(/^---\n[\s\S]*?\n---\n/);
    return match ? doc.slice(match[0].length) : doc;
  }

  async function handleCopy() {
    const fullText = editorView.state.doc.toString();
    const body = extractBody(fullText);
    await navigator.clipboard.writeText(body);
    copied = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<button
  class="copy-button"
  on:click={handleCopy}
  aria-label="本文をコピー"
>
  {copied ? '✓ コピー済み' : 'コピー'}
</button>

<style>
  .copy-button {
    position: fixed;
    top: 12px;
    right: 16px;
    z-index: 100;
    padding: 6px 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background-color: #ffffff;
    color: #374151;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .copy-button:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }

  .copy-button:active {
    background-color: #e5e7eb;
  }
</style>
