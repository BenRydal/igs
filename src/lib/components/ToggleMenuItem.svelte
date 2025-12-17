<script lang="ts">
  import MdCheck from '~icons/mdi/check'

  interface Props {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    showCheckIcon?: boolean // Show checkmark when checked (default: true)
    showCheckbox?: boolean // Show actual checkbox instead of icon
    class?: string
  }

  let {
    label,
    checked = $bindable(),
    onChange,
    disabled = false,
    showCheckIcon = true,
    showCheckbox = false,
    class: className = '',
  }: Props = $props()

  const handleClick = () => {
    if (disabled) return
    const newValue = !checked
    checked = newValue
    onChange(newValue)
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
    role="menuitemcheckbox"
    aria-checked={checked}
    tabindex={disabled ? -1 : 0}
  >
    {#if showCheckbox}
      <input
        type="checkbox"
        {checked}
        {disabled}
        class="checkbox checkbox-sm mr-2"
        tabindex="-1"
        onclick={(e) => e.preventDefault()}
      />
    {:else if showCheckIcon}
      <div class="w-4 h-4 mr-2 flex items-center justify-center">
        {#if checked}
          <MdCheck />
        {/if}
      </div>
    {/if}
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
