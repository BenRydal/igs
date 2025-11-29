/**
 * Tooltip system barrel exports
 *
 * Provides centralized access to tooltip components and registry
 */

export { default as RichTooltip } from '$lib/components/RichTooltip.svelte'
export {
  tooltipRegistry,
  getTooltip,
  getTooltipSafe,
  hasTooltip,
  getAllTooltipIds,
  getTooltipsByPrefix,
} from './registry'
export type { TooltipContent } from './registry'
