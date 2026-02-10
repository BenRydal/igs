/**
 * Timeline Module
 *
 * Re-exports from svelte-interactive-timeline library plus IGS-specific components.
 */

// IGS-specific components (use singleton store, IGS-specific layers)
export { default as TimelineContainer } from './components/TimelineContainer.svelte';
export { default as TimelineCanvas } from './components/TimelineCanvas.svelte';
export { default as TimelineControls } from './components/TimelineControls.svelte';

// IGS-specific renderer (includes ActivityGradientLayer)
export { TimelineRenderer } from './rendering/renderer';
export { ActivityGradientLayer } from './rendering/layers/activity-gradient';

// Re-export common library utilities for convenience
export {
	// Types
	type TimelineState,
	type RenderContext,
	type RenderLayer,
	type DragTarget,
	type HitTarget,
	// Config factories
	createColorScheme,
	createLayoutConfig,
	defaultColorScheme,
	defaultLayoutConfig,
	type TimelineColorScheme,
	type TimelineLayoutConfig,
	// Layers (for custom layer stacks)
	BackgroundLayer,
	PlayheadLayer,
	HoverLayer,
	ZoomSelectionLayer,
	// Utilities
	formatTime,
	clamp,
	mapRange
} from 'svelte-interactive-timeline';
