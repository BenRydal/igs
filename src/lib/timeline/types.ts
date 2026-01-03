/**
 * Timeline Types
 *
 * Core type definitions for the custom timeline component.
 */

/** What the user is currently dragging */
export type DragTarget = 'playhead' | 'pan' | null;

/** Hit test result */
export type HitTarget = 'playhead' | 'track' | 'empty';

/** Complete timeline state */
export interface TimelineState {
	// Time bounds (full data range)
	dataStart: number;
	dataEnd: number;

	// View window (what's visible - controls playback bounds)
	viewStart: number;
	viewEnd: number;

	// Playhead
	currentTime: number;

	// Pixel bounds (for coordinate conversion)
	leftX: number;
	rightX: number;

	// UI state
	hoveredTime: number | null;
	isDragging: DragTarget;
}

/** Context passed to render layers */
export interface RenderContext {
	ctx: CanvasRenderingContext2D;
	state: TimelineState;
	width: number;
	height: number;
	dpr: number; // Device pixel ratio
	timeToX: (time: number) => number;
	xToTime: (x: number) => number;
}

/** Base interface for render layers */
export interface RenderLayer {
	name: string;
	visible: boolean;
	render(ctx: RenderContext): void;
}
