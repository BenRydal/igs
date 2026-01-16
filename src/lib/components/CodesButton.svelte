<script lang="ts">
  import { onDestroy } from 'svelte'
  import { computePosition, flip, shift, offset } from '@floating-ui/dom'
  import { clickOutside } from '$lib/actions/clickOutside'
  import { Z_INDEX } from '$lib/styles/z-index'
  import '$lib/styles/dropdown.css'
  import MdChevronDown from '~icons/mdi/chevron-down'
  import CodeStore from '../../stores/codeStore'
  import ConfigStore from '../../stores/configStore'
  import P5Store from '../../stores/p5Store'
  import { toggleColorMode } from '$lib/history/config-actions'
  import { setCodeEnabled, toggleAllCodes, setCodeColor } from '$lib/history/data-actions'
  import type p5 from 'p5'

  let buttonElement = $state<HTMLButtonElement | null>(null)
  let dropdownElement = $state<HTMLDivElement | null>(null)
  let isOpen = $state(false)
  let p5Instance: p5 | null = null

  const unsubscribeP5 = P5Store.subscribe((instance) => {
    p5Instance = instance
  })

  onDestroy(unsubscribeP5)

  const sortedCodes = $derived(
    [...$CodeStore].sort((a, b) => {
      if (a.code.toLowerCase() === 'no codes') return 1
      if (b.code.toLowerCase() === 'no codes') return -1
      return a.code.localeCompare(b.code)
    })
  )

  const allEnabled = $derived($CodeStore.every((code) => code.enabled))

  function close() {
    isOpen = false
  }

  // Position dropdown using floating-ui
  $effect(() => {
    if (isOpen && dropdownElement && buttonElement) {
      computePosition(buttonElement, dropdownElement, {
        placement: 'top',
        middleware: [offset(8), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        if (dropdownElement) {
          dropdownElement.style.left = `${x}px`
          dropdownElement.style.top = `${y}px`
        }
      })
    }
  })

  function handleCodeChange(code: string, enabled: boolean) {
    setCodeEnabled(code, enabled)
    p5Instance?.loop()
  }

  function handleColorChange(code: string, color: string) {
    setCodeColor(code, color)
    p5Instance?.loop()
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && isOpen && close()} />

<button
  bind:this={buttonElement}
  class="codes-button"
  onclick={() => (isOpen = !isOpen)}
  aria-haspopup="true"
  aria-expanded={isOpen}
>
  Codes
  <MdChevronDown class="chevron" />
</button>

{#if isOpen}
  <div
    bind:this={dropdownElement}
    class="codes-dropdown"
    style:z-index={Z_INDEX.DROPDOWN}
    use:clickOutside={{ onClickOutside: close, exclude: buttonElement ? [buttonElement] : [] }}
    onwheel={(e) => e.stopPropagation()}
    role="menu"
  >
    <ul class="dropdown-content codes-list">
      <li class="dropdown-item">
        <label class="checkbox-label">
          <input
            type="checkbox"
            class="checkbox"
            checked={allEnabled}
            onchange={() => { toggleAllCodes(); p5Instance?.loop() }}
          />
          Enable All
        </label>
      </li>

      <li class="dropdown-item">
        <label class="checkbox-label">
          <input
            type="checkbox"
            class="checkbox"
            checked={$ConfigStore.isPathColorMode}
            onchange={() => { toggleColorMode(); p5Instance?.loop() }}
          />
          Color by Codes
        </label>
      </li>

      <li class="divider"></li>

      {#each sortedCodes as code, index (code.code)}
        <li class="code-header">{code.code.toUpperCase()}</li>
        <li class="dropdown-item">
          <label class="checkbox-label">
            <input
              type="checkbox"
              class="checkbox"
              checked={code.enabled}
              onchange={(e) => handleCodeChange(code.code, e.currentTarget.checked)}
            />
            Enabled
          </label>
        </li>
        <li class="dropdown-item">
          <div class="color-row">
            <input
              type="color"
              class="color-picker"
              value={code.color}
              onchange={(e) => handleColorChange(code.code, e.currentTarget.value)}
            />
            <span>Color</span>
          </div>
        </li>
        {#if index !== sortedCodes.length - 1}
          <li class="divider"></li>
        {/if}
      {/each}
    </ul>
  </div>
{/if}

<style>
  .codes-button {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.625rem;
    border-radius: 9999px;
    background-color: #e5e5e5;
    border: none;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1f2937;
    transition: background-color 0.15s;
  }

  .codes-button:hover {
    background-color: #d4d4d4;
  }

  .codes-button:active {
    background-color: #c4c4c4;
  }

  .chevron {
    width: 1rem;
    height: 1rem;
    margin-left: -0.125rem;
  }

  .codes-dropdown {
    position: fixed;
    background: white;
    border-radius: 0.5rem;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    padding: 0.5rem;
    min-width: 200px;
  }

  .codes-list {
    max-height: calc(100vh - 150px);
    overflow-y: auto;
  }

  .code-header {
    padding: 0.5rem;
    font-weight: 600;
    font-size: 0.75rem;
    color: #6b7280;
    letter-spacing: 0.025em;
  }
</style>
