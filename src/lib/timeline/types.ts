/**
 * Timeline Types
 *
 * Core type definitions for the custom timeline component.
 */

/** Track segment representing data over a time range */
export interface TrackSegment {
	start: number; // Start time (seconds)
	end: number; // End time (seconds)
	value: number; // 0-1 intensity/density for rendering
	color?: string; // Override track color
	label?: string; // Hover label
	metadata?: unknown; // Original data reference
}

/** A track displays data over time */
export interface TimelineTrack {
	id: string;
	type: 'conversation' | 'code' | 'movement' | 'waveform' | 'thumbnail';
	label: string;
	color: string;
	height: number; // Track height in pixels
	visible: boolean;
	collapsed: boolean; // Show as thin line when collapsed
	data: TrackSegment[];
}

/** Marker/bookmark on timeline */
export interface TimelineMarker {
	id: string;
	time: number;
	label: string;
	color: string;
	type: 'bookmark' | 'event' | 'boundary';
}

/** What the user is currently dragging */
export type DragTarget = 'playhead' | 'selection-start' | 'selection-end' | 'pan' | null;

/** Hit test result */
export type HitTarget =
	| 'playhead'
	| 'selection-start'
	| 'selection-end'
	| 'track'
	| 'header'
	| 'empty';

/** Complete timeline state */
export interface TimelineState {
	// Time bounds (full data range)
	dataStart: number;
	dataEnd: number;

	// View window (what's visible - enables zoom/pan)
	viewStart: number;
	viewEnd: number;

	// Selection range (left/right markers)
	selectionStart: number;
	selectionEnd: number;

	// Playhead
	currentTime: number;

	// Tracks
	tracks: TimelineTrack[];

	// Markers
	markers: TimelineMarker[];

	// Pixel bounds (for coordinate conversion)
	leftX: number;
	rightX: number;

	// UI state
	hoveredTime: number | null;
	hoveredTrack: string | null;
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
