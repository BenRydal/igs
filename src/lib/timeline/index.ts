/**
 * Timeline Module
 *
 * Re-exports from the npm package and local store wrapper.
 */

// Store (now backed by npm package)
export { timelineV2Store, viewDuration, dataDuration, zoomLevel, isZoomed } from './store';

// Types and utilities from the npm package
export type {
	TimelineState,
	RenderContext,
	RenderLayer,
	DragTarget,
	HitTarget
} from 'svelte-interactive-timeline';
export {
	formatTime,
	clamp,
	mapRange,
	generateGridLines,
	calculateGridInterval,
	TimelineRenderer
} from 'svelte-interactive-timeline';

// New wrapper component
export { IgsTimeline } from '../timeline-migration';
