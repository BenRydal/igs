<script lang="ts">
  interface Props {
    value: string
    onChange: (color: string) => void
    label?: string
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    disabled?: boolean
    class?: string
    swatches?: string[]
    showSwatches?: boolean
  }

  let {
    value = $bindable('#000000'),
    onChange,
    label = 'Color',
    size = 'md',
    showLabel = true,
    disabled = false,
    class: className = '',
    swatches = [
      '#ef4444',
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#6366f1',
    ],
    showSwatches = false,
  }: Props = $props()

  // Size mapping in pixels
  const sizeMap = {
    sm: 24,
    md: 30,
    lg: 40,
  }

  const pickerSize = $derived(sizeMap[size])

  // Show swatches panel state
  let showSwatchPanel = $state(false)
  let swatchPanelRef = $state<HTMLDivElement>()

  function handleColorChange(e: Event) {
    const target = e.target as HTMLInputElement
    onChange(target.value)
  }

  function handleSwatchClick(swatchColor: string) {
    value = swatchColor
    onChange(swatchColor)
    showSwatchPanel = false
  }

  function toggleSwatchPanel() {
    if (!disabled) {
      showSwatchPanel = !showSwatchPanel
    }
  }

  // Close swatch panel when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (swatchPanelRef && !swatchPanelRef.contains(event.target as Node)) {
      showSwatchPanel = false
    }
  }

  $effect(() => {
    if (showSwatchPanel) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  })

  // Handle keyboard accessibility
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      ;(e.target as HTMLInputElement).click()
    }
  }

  // Close swatch panel on Escape
  function handleGlobalKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && showSwatchPanel) {
      e.preventDefault()
      e.stopPropagation()
      showSwatchPanel = false
    }
  }

  $effect(() => {
    if (showSwatchPanel) {
      document.addEventListener('keydown', handleGlobalKeyDown)
      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown)
      }
    }
  })

  function handleSwatchKeyDown(e: KeyboardEvent, swatchColor: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSwatchClick(swatchColor)
    }
  }
</script>

<div class="color-picker-wrapper {className}">
  <div class="flex items-center gap-2">
    <!-- Color Input -->
    <div class="relative">
      <input
        type="color"
        {value}
        {disabled}
        onchange={handleColorChange}
        onkeydown={handleKeyDown}
        class="color-picker-input"
        style="width: {pickerSize}px; height: {pickerSize}px;"
        aria-label={label}
      />
      {#if showSwatches}
        <button
          type="button"
          class="swatch-toggle"
          onclick={toggleSwatchPanel}
          {disabled}
          aria-label="Toggle color swatches"
          style="width: {pickerSize}px; height: {pickerSize}px;"
        >
          <div class="swatch-icon" style="background: {value};"></div>
        </button>
      {/if}
    </div>

    <!-- Label -->
    {#if showLabel && label}
      <span class="color-picker-label">{label}</span>
    {/if}
  </div>

  <!-- Swatch Panel -->
  {#if showSwatches && showSwatchPanel}
    <div class="swatch-panel" bind:this={swatchPanelRef}>
      <div class="swatch-grid">
        {#each swatches as swatchColor}
          <button
            type="button"
            class="swatch-item {swatchColor === value ? 'selected' : ''}"
            style="background: {swatchColor};"
            onclick={() => handleSwatchClick(swatchColor)}
            onkeydown={(e) => handleSwatchKeyDown(e, swatchColor)}
            aria-label="Select color {swatchColor}"
            tabindex="0"
          >
            {#if swatchColor === value}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="check-icon"
              >
                <path
                  fill-rule="evenodd"
                  d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .color-picker-wrapper {
    display: inline-block;
    position: relative;
  }

  .color-picker-input {
    border: none;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .color-picker-input:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .color-picker-input:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .color-picker-input:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .color-picker-label {
    font-size: 14px;
    color: inherit;
    user-select: none;
  }

  .swatch-toggle {
    position: absolute;
    top: 0;
    left: 0;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    background: transparent;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .swatch-toggle:hover:not(:disabled) {
    transform: scale(1.1);
  }

  .swatch-toggle:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .swatch-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .swatch-icon {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .swatch-panel {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 200px;
  }

  .swatch-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .swatch-item {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .swatch-item:hover {
    transform: scale(1.1);
    border-color: #3b82f6;
  }

  .swatch-item:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .swatch-item.selected {
    border-color: #1e293b;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .check-icon {
    width: 20px;
    height: 20px;
    color: white;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }

  /* Ensure color picker input works properly across browsers */
  .color-picker-input::-webkit-color-swatch-wrapper {
    padding: 0;
    border-radius: 50%;
  }

  .color-picker-input::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
  }

  .color-picker-input::-moz-color-swatch {
    border: none;
    border-radius: 50%;
  }
</style>
