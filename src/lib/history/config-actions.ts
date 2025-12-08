import { get } from 'svelte/store'
import ConfigStore, { type ConfigStoreType, initialConfig } from '../../stores/configStore'
import { historyStore } from '../../stores/historyStore'
import { deepClone } from './index'

/**
 * Toggle a boolean config value with undo support
 */
export function toggleConfig(key: keyof ConfigStoreType, label: string): void {
  const before = get(ConfigStore)
  const beforeValue = before[key]

  if (typeof beforeValue !== 'boolean') {
    console.warn(`toggleConfig: ${key} is not a boolean`)
    return
  }

  ConfigStore.update((c) => ({ ...c, [key]: !beforeValue }))

  historyStore.push({
    actionType: 'config.toggle',
    actionLabel: `${!beforeValue ? 'Enabled' : 'Disabled'} ${label}`,
    undo: () => ConfigStore.update((c) => ({ ...c, [key]: beforeValue })),
    redo: () => ConfigStore.update((c) => ({ ...c, [key]: !beforeValue })),
  })
}

/**
 * Set a numeric config value with undo support
 * Includes debouncing for slider changes
 */
let sliderDebounceTimer: ReturnType<typeof setTimeout> | null = null
let sliderInitialValue: number | null = null
let sliderKey: string | null = null

export function setConfigNumber(
  key: keyof ConfigStoreType,
  value: number,
  label: string,
  debounce = 300
): void {
  const current = get(ConfigStore)

  // Start tracking if this is a new slider interaction
  if (sliderKey !== key || sliderInitialValue === null) {
    sliderInitialValue = current[key] as number
    sliderKey = key
  }

  // Apply the value immediately
  ConfigStore.update((c) => ({ ...c, [key]: value }))

  // Clear existing timer
  if (sliderDebounceTimer) clearTimeout(sliderDebounceTimer)

  // Set new timer to commit to history after debounce
  sliderDebounceTimer = setTimeout(() => {
    if (sliderInitialValue !== null && sliderInitialValue !== value) {
      const initialVal = sliderInitialValue
      historyStore.push({
        actionType: 'config.slider',
        actionLabel: `Changed ${label}`,
        undo: () => ConfigStore.update((c) => ({ ...c, [key]: initialVal })),
        redo: () => ConfigStore.update((c) => ({ ...c, [key]: value })),
      })
    }
    sliderInitialValue = null
    sliderKey = null
    sliderDebounceTimer = null
  }, debounce)
}

/**
 * Set a string config value with undo support
 */
export function setConfigString(key: keyof ConfigStoreType, value: string, label: string): void {
  const before = get(ConfigStore)
  const beforeValue = before[key]

  if (typeof beforeValue !== 'string') {
    console.warn(`setConfigString: ${key} is not a string`)
    return
  }

  if (beforeValue === value) return

  ConfigStore.update((c) => ({ ...c, [key]: value }))

  historyStore.push({
    actionType: 'config.text',
    actionLabel: `Changed ${label}`,
    undo: () => ConfigStore.update((c) => ({ ...c, [key]: beforeValue })),
    redo: () => ConfigStore.update((c) => ({ ...c, [key]: value })),
  })
}

/**
 * Reset config to defaults with undo support
 */
export function resetConfig(): void {
  const before = deepClone(get(ConfigStore))

  ConfigStore.set(initialConfig)

  historyStore.push({
    actionType: 'config.reset',
    actionLabel: 'Reset settings',
    undo: () => ConfigStore.set(deepClone(before)),
    redo: () => ConfigStore.set(initialConfig),
  })
}

// Specific toggle helpers for common operations
export const toggleMovement = () => toggleConfig('movementToggle', 'movement trails')
export const toggleStops = () => toggleConfig('stopsToggle', 'stop points')
export const toggleCircle = () => toggleConfig('circleToggle', 'circle selection')
export const toggleSlice = () => toggleConfig('sliceToggle', 'slice selection')
export const toggleHighlight = () => toggleConfig('highlightToggle', 'highlight mode')
export const toggleAlign = () => toggleConfig('alignToggle', 'talk alignment')
export const toggleColorMode = () => toggleConfig('isPathColorMode', 'color by codes')
export const toggleDataHasCodes = () => toggleConfig('dataHasCodes', 'data has codes')

// Numeric value helpers
export const setAnimationRate = (value: number) =>
  setConfigNumber('animationRate', value, 'animation speed')
export const setSamplingInterval = (value: number) =>
  setConfigNumber('samplingInterval', value, 'sampling interval')
export const setStopSliderValue = (value: number) =>
  setConfigNumber('stopSliderValue', value, 'stop threshold')
export const setConversationRectWidth = (value: number) =>
  setConfigNumber('conversationRectWidth', value, 'conversation width')
export const setMovementStrokeWeight = (value: number) =>
  setConfigNumber('movementStrokeWeight', value, 'movement stroke')
export const setStopStrokeWeight = (value: number) =>
  setConfigNumber('stopStrokeWeight', value, 'stop stroke')

// String value helpers
export const setWordToSearch = (value: string) =>
  setConfigString('wordToSearch', value, 'search word')
