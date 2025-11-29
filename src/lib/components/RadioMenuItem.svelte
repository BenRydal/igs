<script lang="ts">
  import MdCircleOutline from '~icons/mdi/circle-outline'
  import MdCircle from '~icons/mdi/circle'

  interface Props {
    label: string
    selected: boolean
    onSelect: () => void
    disabled?: boolean
    class?: string
  }

  let {
    label,
    selected = $bindable(),
    onSelect,
    disabled = false,
    class: className = '',
  }: Props = $props()

  const handleClick = () => {
    if (disabled) return
    selected = true
    onSelect()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }
</script>

<li>
  <button
    onclick={handleClick}
    onkeydown={handleKeydown}
    {disabled}
    class="w-full text-left flex items-center {className}"
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
    role="menuitemradio"
    aria-checked={selected}
    tabindex={disabled ? -1 : 0}
  >
    <div class="w-4 h-4 mr-2 flex items-center justify-center">
      {#if selected}
        <MdCircle />
      {:else}
        <MdCircleOutline />
      {/if}
    </div>
    <span>{label}</span>
  </button>
</li>

<style>
  button:not(:disabled):hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  button:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  button:active:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
  }
</style>
