<!-- // @codd-trace: sprint:30 task:30-1 deliverable:CopyButton -->
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
  class:copied
  on:click={handleCopy}
  aria-label="本文をクリップボードにコピー"
>
  {copied ? '✓ コピー済み' : 'コピー'}
</button>

<style>
  .copy-button {
    position: fixed;
    top: 0.75rem;
    right: 1rem;
    z-index: 100;
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    font-family: inherit;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background-color: #ffffff;
    color: #374151;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }

  .copy-button:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }

  .copy-button.copied {
    background-color: #dcfce7;
    border-color: #86efac;
    color: #166534;
    cursor: default;
  }
</style>
