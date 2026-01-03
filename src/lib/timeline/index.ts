/**
 * Timeline Module
 *
 * Custom canvas-based timeline component with zoom, pan, and selection.
 */

// Components
export { default as TimelineContainer } from './components/TimelineContainer.svelte';
export { default as TimelineCanvas } from './components/TimelineCanvas.svelte';
export { default as TimelineControls } from './components/TimelineControls.svelte';

// Store
export { timelineV2Store, zoomLevel, isZoomed } from './store';

// Types
export type {
	TimelineState,
	TimelineTrack,
	TrackSegment,
	TimelineMarker,
	RenderContext,
	RenderLayer,
	DragTarget,
	HitTarget
} from './types';

// Utilities
export { formatTime, clamp, mapRange, generateGridLines, calculateGridInterval } from './utils';

// Renderer (for advanced use)
export { TimelineRenderer } from './rendering/renderer';
