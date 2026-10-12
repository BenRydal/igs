<script lang="ts">
  import type { Component, Snippet } from 'svelte'

  let {
    icon: Icon,
    tooltip = '',
    label = '',
    id = '',
    onclick,
    children,
    active = false,
  }: {
    icon?: Component
    tooltip?: string
    /** Visible text rendered beside the icon. Omit for an icon-only square button. */
    label?: string
    id?: string
    onclick?: (event: MouseEvent) => void
    children?: Snippet
    active?: boolean
  } = $props()
</script>

<div class="tooltip tooltip-bottom" data-tip={tooltip}>
  <button
    class="btn btn-ghost icon-btn"
    class:btn-square={!label}
    class:icon-btn--labeled={label}
    class:btn-active={active}
    type="button"
    {id}
    {onclick}
  >
    {#if Icon}
      <Icon />
    {:else if children}
      {@render children()}
    {/if}
    {#if label}
      <span class="icon-btn__label">{label}</span>
    {/if}
  </button>
</div>

<style>
  .icon-btn {
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
  }

  .icon-btn :global(svg) {
    width: 24px;
    height: 24px;
  }

  /* Labeled buttons grow to fit their text instead of staying square. */
  .icon-btn--labeled {
    width: auto;
    gap: 0.375rem;
    padding-inline: 0.625rem;
  }

  .icon-btn__label {
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
  }
</style>
