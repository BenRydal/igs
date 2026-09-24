import { writable } from 'svelte/store'

export type Tool = 'igs' | 'mondrian'

/** `?mode=mondrian` lands in Mondrian; anything else is IGS. */
export const TOOL_PARAM = 'mode'

export function toolFromParam(value: string | null): Tool {
  return value === 'mondrian' ? 'mondrian' : 'igs'
}

/** The tool on screen, for code outside the page (keyboard shortcuts). Set in the browser only. */
export const activeTool = writable<Tool>('igs')
