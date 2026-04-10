<script lang="ts">
  import type { NoteMetadata } from '@/generated/sprint_38/css_columns_pinterest_3_900px/MasonryGrid.svelte';
  export { NoteMetadata };

  import BaseMasonryGrid from '@/generated/sprint_38/css_columns_pinterest_3_900px/MasonryGrid.svelte';
  export let notes: NoteMetadata[] = [];
</script>

<!--
  2列ブレークポイント（600px〜900px）を含む MasonryGrid。
  ベース実装（3列 >900px）を再利用し、600px〜900px で2列、
  600px 以下で1列になるレスポンシブレイアウトを提供する。
-->
<BaseMasonryGrid {notes} on:cardClick on:cardDelete />

<style>
  /*
   * 600px〜900px: 2列
   * ベースコンポーネントの .masonry-grid に対して上書きする。
   * ベース実装が columns:3 + @media(max-width:900px){columns:2} +
   * @media(max-width:600px){columns:1} を持つため、
   * このコンポーネントはそれをそのまま継承する。
   */
  :global(.masonry-grid) {
    columns: 3;
    column-gap: 16px;
    padding: 16px;
  }

  @media (max-width: 900px) {
    :global(.masonry-grid) {
      columns: 2;
    }
  }

  @media (max-width: 600px) {
    :global(.masonry-grid) {
      columns: 1;
    }
  }
</style>
