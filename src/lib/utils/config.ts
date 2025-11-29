/**
 * Configuration and toggle management utilities
 */

import type { ConfigStoreType } from '$stores/configStore'
import ConfigStore from '$stores/configStore'
import { redrawCanvas } from './p5'

/**
 * Toggle groups - exported as constants
 */
export const FILTER_TOGGLES = ['movementToggle', 'stopsToggle'] as const
export const SELECT_TOGGLES = ['circleToggle', 'sliceToggle', 'highlightToggle'] as const
export const CONVERSATION_TOGGLES = ['alignToggle'] as const

/**
 * Toggle type definitions
 */
export type FilterToggle = (typeof FILTER_TOGGLES)[number]
export type SelectToggle = (typeof SELECT_TOGGLES)[number]
export type ConversationToggle = (typeof CONVERSATION_TOGGLES)[number]
export type ToggleKey = FilterToggle | SelectToggle | ConversationToggle

/**
 * Updates a configuration value and triggers p5 redraw
 * @param key - The configuration key to update
 * @param value - The new value for the configuration key
 * @example updateConfig('animationRate', 0.5)
 */
export function updateConfig<K extends keyof ConfigStoreType>(
  key: K,
  value: ConfigStoreType[K]
): void {
  ConfigStore.update((store) => ({ ...store, [key]: value }))
  redrawCanvas()
}

/**
 * Updates a configuration value from an input event and triggers p5 redraw
 * @param event - The input event from the UI element
 * @param key - The configuration key to update
 * @param parser - Optional custom parser function (defaults to parseFloat)
 * @example updateConfigFromInput(event, 'stopSliderValue')
 * @example updateConfigFromInput(event, 'smallDataThreshold', parseInt)
 */
export function updateConfigFromInput(
  event: Event,
  key: keyof ConfigStoreType,
  parser: (value: string) => number = parseFloat
): void {
  const target = event.target as HTMLInputElement
  ConfigStore.update((value) => ({ ...value, [key]: parser(target.value) }))
  redrawCanvas()
}

/**
 * Toggles mutually exclusive options within a group
 * When a toggle is selected, all other toggles in the group are disabled
 * @param selection - The toggle to activate/deactivate
 * @param options - The array of mutually exclusive toggle options
 * @example toggleExclusive('circleToggle', SELECT_TOGGLES)
 */
export function toggleExclusive<T extends readonly string[]>(
  selection: T[number],
  options: T
): void {
  ConfigStore.update((store: ConfigStoreType) => {
    const updatedStore = { ...store }
    options.forEach((key) => {
      if (key.endsWith('Toggle')) {
        updatedStore[key] = key === selection ? !updatedStore[key] : false
      }
    })
    return updatedStore
  })
  redrawCanvas()
}
