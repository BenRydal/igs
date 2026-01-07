<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    icon,
    tooltip = '',
    id = '',
    onclick,
    children,
    active = false,
  }: {
    icon?: ConstructorOfATypedSvelteComponent
    tooltip?: string
    id?: string
    onclick?: (event: MouseEvent) => void
    children?: Snippet
    active?: boolean
  } = $props()
</script>

<div class="tooltip tooltip-bottom" data-tip={tooltip}>
  <button class="btn btn-square btn-ghost icon-btn" class:btn-active={active} type="button" {id} {onclick}>
    {#if icon}
      <svelte:component this={icon} />
    {:else if children}
      {@render children()}
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
</style>
