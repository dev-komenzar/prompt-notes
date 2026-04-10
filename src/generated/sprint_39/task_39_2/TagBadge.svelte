<script lang="ts">
  export let tag: string;
  export let onClick: ((tag: string) => void) | undefined = undefined;

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onClick?.(tag);
  }
</script>

<span
  class="tag-badge"
  role={onClick ? 'button' : undefined}
  tabindex={onClick ? 0 : undefined}
  on:click={onClick ? handleClick : undefined}
  on:keydown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick?.(tag); } } : undefined}
>
  {tag}
</span>

<style>
  .tag-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    background-color: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
    font-size: 0.75rem;
    line-height: 1.5;
    white-space: nowrap;
    cursor: default;
    user-select: none;
  }

  .tag-badge[role='button'] {
    cursor: pointer;
  }

  .tag-badge[role='button']:hover {
    background-color: rgba(59, 130, 246, 0.22);
  }
</style>
