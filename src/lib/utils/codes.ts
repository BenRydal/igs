/**
 * Code store management utilities
 */

import CodeStore from '$stores/codeStore'
import { get } from 'svelte/store'
import { redrawCanvas } from './p5'

/**
 * Toggles all codes on or off and triggers p5 redraw
 * @param enabled - Optional boolean to set all codes to a specific state. If not provided, toggles based on current state.
 * @example toggleAllCodes() // Toggles based on current state
 * @example toggleAllCodes(true) // Enables all codes
 */
export function toggleAllCodes(enabled?: boolean): void {
  const codes = get(CodeStore)
  const allEnabled = codes.every((code) => code.enabled)
  const newState = enabled !== undefined ? enabled : !allEnabled

  CodeStore.update((codes) => codes.map((code) => ({ ...code, enabled: newState })))
  redrawCanvas()
}

/**
 * Enables a specific code by name and triggers p5 redraw
 * @param codeName - The name of the code to enable
 * @example enableCode('Movement')
 */
export function enableCode(codeName: string): void {
  CodeStore.update((codes) =>
    codes.map((code) => (code.code === codeName ? { ...code, enabled: true } : code))
  )
  redrawCanvas()
}

/**
 * Disables a specific code by name and triggers p5 redraw
 * @param codeName - The name of the code to disable
 * @example disableCode('Movement')
 */
export function disableCode(codeName: string): void {
  CodeStore.update((codes) =>
    codes.map((code) => (code.code === codeName ? { ...code, enabled: false } : code))
  )
  redrawCanvas()
}

/**
 * Sets the color of a specific code and triggers p5 redraw
 * @param codeName - The name of the code to update
 * @param color - The new color value (hex string)
 * @example setCodeColor('Movement', '#ff0000')
 */
export function setCodeColor(codeName: string, color: string): void {
  CodeStore.update((codes) =>
    codes.map((code) => (code.code === codeName ? { ...code, color } : code))
  )
  redrawCanvas()
}
