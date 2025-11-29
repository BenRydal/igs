<script lang="ts">
  import { tick } from 'svelte'

  interface Props {
    id: string
    label: string
    value: number
    min?: number
    max?: number
    step?: number
    unit?: string
    showValue?: boolean
    formatValue?: (value: number) => string
    onChange: (value: number) => void
    disabled?: boolean
    class?: string
    debounce?: number
  }

  let {
    id,
    label,
    value = $bindable(),
    min = 0,
    max = 100,
    step = 1,
    unit = '',
    showValue = true,
    formatValue,
    onChange,
    disabled = false,
    class: customClass = '',
    debounce = 0,
  }: Props = $props()

  // Internal state for debouncing
  let internalValue = $state(value)
  let debounceTimeout: ReturnType<typeof setTimeout>

  // Update internal value when prop changes externally
  $effect(() => {
    internalValue = value
  })

  // Computed display value
  let displayValue = $derived(() => {
    if (formatValue) {
      return formatValue(internalValue)
    }
    return unit ? `${internalValue.toFixed(2)} ${unit}` : internalValue.toFixed(2)
  })

  // Handle input change with optional debouncing
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement
    const newValue = parseFloat(target.value)

    internalValue = newValue

    if (debounce > 0) {
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        onChange(newValue)
      }, debounce)
    } else {
      onChange(newValue)
    }
  }

  // Compute aria values
  let ariaValueNow = $derived(Math.round(internalValue))
  let ariaValueText = $derived(displayValue())
  let percentage = $derived(((internalValue - min) / (max - min)) * 100)
</script>

<div class="range-slider-container {customClass}">
  {#if showValue}
    <div class="flex justify-between items-center mb-2">
      <label for={id} class="text-sm font-medium text-base-content">
        {label}
      </label>
      <span class="text-sm font-mono text-base-content/70">
        {displayValue()}
      </span>
    </div>
  {:else}
    <label for={id} class="sr-only">{label}</label>
  {/if}

  <input
    {id}
    type="range"
    {min}
    {max}
    {step}
    {disabled}
    value={internalValue}
    oninput={handleInput}
    class="range range-primary {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
    aria-label={label}
    aria-valuenow={ariaValueNow}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuetext={ariaValueText}
    aria-disabled={disabled}
    style="--range-percentage: {percentage}%"
  />
</div>

<style>
  .range-slider-container {
    width: 100%;
  }

  /* Custom range styling with visual feedback */
  input[type='range'].range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 0.5rem;
    border-radius: 0.25rem;
    background: linear-gradient(
      to right,
      hsl(var(--p)) 0%,
      hsl(var(--p)) var(--range-percentage, 0%),
      hsl(var(--bc) / 0.1) var(--range-percentage, 0%),
      hsl(var(--bc) / 0.1) 100%
    );
    outline: none;
    transition: opacity 0.2s;
  }

  input[type='range'].range:hover {
    opacity: 0.9;
  }

  input[type='range'].range:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Webkit (Chrome, Safari, Edge) */
  input[type='range'].range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: hsl(var(--p));
    cursor: pointer;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.2),
      0 0 0 0 hsl(var(--p) / 0.3);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  input[type='range'].range::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.3),
      0 0 0 4px hsl(var(--p) / 0.2);
  }

  input[type='range'].range::-webkit-slider-thumb:active {
    transform: scale(0.95);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.2),
      0 0 0 6px hsl(var(--p) / 0.3);
  }

  /* Firefox */
  input[type='range'].range::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: hsl(var(--p));
    border: none;
    cursor: pointer;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.2),
      0 0 0 0 hsl(var(--p) / 0.3);
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  input[type='range'].range::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.3),
      0 0 0 4px hsl(var(--p) / 0.2);
  }

  input[type='range'].range::-moz-range-thumb:active {
    transform: scale(0.95);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.2),
      0 0 0 6px hsl(var(--p) / 0.3);
  }

  /* Firefox track */
  input[type='range'].range::-moz-range-track {
    height: 0.5rem;
    border-radius: 0.25rem;
    background: transparent;
  }
</style>
