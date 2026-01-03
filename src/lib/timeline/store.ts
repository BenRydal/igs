/**
 * Timeline Store
 *
 * Svelte store for managing timeline state with zoom, pan, and selection.
 */

import { writable, derived, get } from 'svelte/store';
import type { TimelineState, TimelineTrack, TimelineMarker, DragTarget } from './types';
import { clamp, mapRange, zoomAtPoint, panView } from './utils';

/** Initial empty state */
const initialState: TimelineState = {
	// Time bounds
	dataStart: 0,
	dataEnd: 0,

	// View window
	viewStart: 0,
	viewEnd: 0,

	// Selection
	selectionStart: 0,
	selectionEnd: 0,

	// Playhead
	currentTime: 0,

	// Data
	tracks: [],
	markers: [],

	// Pixel bounds
	leftX: 0,
	rightX: 0,

	// UI
	hoveredTime: null,
	hoveredTrack: null,
	isDragging: null
};

function createTimelineStore() {
	const { subscribe, set, update } = writable<TimelineState>(initialState);

	// Configuration
	const minZoomDuration = 1; // 1 second minimum zoom

	return {
		subscribe,

		/**
		 * Initialize timeline with data range
		 */
		initialize(endTime: number, startTime: number = 0) {
			update((s) => ({
				...s,
				dataStart: startTime,
				dataEnd: endTime,
				viewStart: startTime,
				viewEnd: endTime,
				selectionStart: startTime,
				selectionEnd: endTime,
				currentTime: startTime
			}));
		},

		/**
		 * Reset to initial empty state
		 */
		reset() {
			set(initialState);
		},

		// ==================== Playhead ====================

		/**
		 * Set current playhead time
		 */
		setCurrentTime(time: number) {
			update((s) => ({
				...s,
				currentTime: clamp(time, s.dataStart, s.dataEnd)
			}));
		},

		/**
		 * Advance playhead by delta (for animation)
		 */
		advanceTime(delta: number) {
			update((s) => {
				const newTime = s.currentTime + delta;
				return {
					...s,
					currentTime: clamp(newTime, s.dataStart, s.dataEnd)
				};
			});
		},

		// ==================== Selection ====================

		/**
		 * Set selection range (left/right markers)
		 */
		setSelection(start: number, end: number) {
			update((s) => ({
				...s,
				selectionStart: clamp(Math.min(start, end), s.dataStart, s.dataEnd),
				selectionEnd: clamp(Math.max(start, end), s.dataStart, s.dataEnd)
			}));
		},

		/**
		 * Set selection start (left marker)
		 */
		setSelectionStart(time: number) {
			update((s) => ({
				...s,
				selectionStart: clamp(time, s.dataStart, s.selectionEnd)
			}));
		},

		/**
		 * Set selection end (right marker)
		 */
		setSelectionEnd(time: number) {
			update((s) => ({
				...s,
				selectionEnd: clamp(time, s.selectionStart, s.dataEnd)
			}));
		},

		// ==================== View (Zoom/Pan) ====================

		/**
		 * Set view window directly
		 */
		setView(start: number, end: number) {
			update((s) => ({
				...s,
				viewStart: clamp(start, s.dataStart, s.dataEnd),
				viewEnd: clamp(end, s.dataStart, s.dataEnd)
			}));
		},

		/**
		 * Zoom in/out centered on a time point
		 */
		zoom(factor: number, centerTime?: number) {
			update((s) => {
				const center = centerTime ?? (s.viewStart + s.viewEnd) / 2;
				const { viewStart, viewEnd } = zoomAtPoint(
					s.viewStart,
					s.viewEnd,
					factor,
					center,
					s.dataStart,
					s.dataEnd,
					minZoomDuration
				);
				return { ...s, viewStart, viewEnd };
			});
		},

		/**
		 * Zoom to fit selection in view
		 */
		zoomToSelection() {
			update((s) => ({
				...s,
				viewStart: s.selectionStart,
				viewEnd: s.selectionEnd
			}));
		},

		/**
		 * Reset view to show all data
		 */
		zoomToFit() {
			update((s) => ({
				...s,
				viewStart: s.dataStart,
				viewEnd: s.dataEnd
			}));
		},

		/**
		 * Pan view by time delta
		 */
		pan(deltaTime: number) {
			update((s) => {
				const { viewStart, viewEnd } = panView(
					s.viewStart,
					s.viewEnd,
					deltaTime,
					s.dataStart,
					s.dataEnd
				);
				return { ...s, viewStart, viewEnd };
			});
		},

		// ==================== Tracks ====================

		/**
		 * Set all tracks
		 */
		setTracks(tracks: TimelineTrack[]) {
			update((s) => ({ ...s, tracks }));
		},

		/**
		 * Add or update a single track
		 */
		upsertTrack(track: TimelineTrack) {
			update((s) => ({
				...s,
				tracks: s.tracks.some((t) => t.id === track.id)
					? s.tracks.map((t) => (t.id === track.id ? track : t))
					: [...s.tracks, track]
			}));
		},

		/**
		 * Remove a track
		 */
		removeTrack(trackId: string) {
			update((s) => ({
				...s,
				tracks: s.tracks.filter((t) => t.id !== trackId)
			}));
		},

		/**
		 * Toggle track visibility
		 */
		toggleTrackVisibility(trackId: string) {
			update((s) => ({
				...s,
				tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t))
			}));
		},

		// ==================== Markers ====================

		/**
		 * Add a marker
		 */
		addMarker(marker: TimelineMarker) {
			update((s) => ({
				...s,
				markers: [...s.markers, marker]
			}));
		},

		/**
		 * Remove a marker
		 */
		removeMarker(markerId: string) {
			update((s) => ({
				...s,
				markers: s.markers.filter((m) => m.id !== markerId)
			}));
		},

		// ==================== UI State ====================

		/**
		 * Set hover state
		 */
		setHover(time: number | null, trackId: string | null = null) {
			update((s) => ({
				...s,
				hoveredTime: time,
				hoveredTrack: trackId
			}));
		},

		/**
		 * Set drag state
		 */
		setDragging(target: DragTarget) {
			update((s) => ({ ...s, isDragging: target }));
		},

		// ==================== Pixel Bounds ====================

		/**
		 * Update pixel positions (called when timeline canvas resizes)
		 */
		updateXPositions(leftX: number, rightX: number) {
			update((s) => ({ ...s, leftX, rightX }));
		},

		// ==================== Coordinate Conversion ====================

		/**
		 * Convert pixel position to time (full data range)
		 */
		pixelToTime(pixel: number): number {
			const s = get({ subscribe });
			return mapRange(pixel, s.leftX, s.rightX, s.dataStart, s.dataEnd);
		},

		/**
		 * Convert time to pixel position (full data range)
		 */
		timeToPixel(time: number): number {
			const s = get({ subscribe });
			return mapRange(time, s.dataStart, s.dataEnd, s.leftX, s.rightX);
		},

		/**
		 * Convert pixel position to time within selection range
		 */
		pixelToSelectedTime(pixel: number): number {
			const s = get({ subscribe });
			return mapRange(pixel, s.leftX, s.rightX, s.selectionStart, s.selectionEnd);
		},

		/**
		 * Get left marker pixel position
		 */
		getLeftMarkerPixel(): number {
			const s = get({ subscribe });
			return mapRange(s.selectionStart, s.dataStart, s.dataEnd, s.leftX, s.rightX);
		},

		/**
		 * Get right marker pixel position
		 */
		getRightMarkerPixel(): number {
			const s = get({ subscribe });
			return mapRange(s.selectionEnd, s.dataStart, s.dataEnd, s.leftX, s.rightX);
		},

		/**
		 * Convert timeline pixel to marker-space pixel
		 */
		pixelToMarkerPixel(pixel: number): number {
			const s = get({ subscribe });
			const leftMarkerPx = mapRange(s.selectionStart, s.dataStart, s.dataEnd, s.leftX, s.rightX);
			const rightMarkerPx = mapRange(s.selectionEnd, s.dataStart, s.dataEnd, s.leftX, s.rightX);
			return mapRange(pixel, s.leftX, s.rightX, leftMarkerPx, rightMarkerPx);
		},

		/**
		 * Convert marker-space pixel to timeline pixel
		 */
		markerPixelToPixel(pixel: number): number {
			const s = get({ subscribe });
			const leftMarkerPx = mapRange(s.selectionStart, s.dataStart, s.dataEnd, s.leftX, s.rightX);
			const rightMarkerPx = mapRange(s.selectionEnd, s.dataStart, s.dataEnd, s.leftX, s.rightX);
			return mapRange(pixel, leftMarkerPx, rightMarkerPx, s.leftX, s.rightX);
		},

		/**
		 * Check if pixel value is within marker range
		 */
		overAxis(pixel: number): boolean {
			const s = get({ subscribe });
			const leftMarkerPx = mapRange(s.selectionStart, s.dataStart, s.dataEnd, s.leftX, s.rightX);
			const rightMarkerPx = mapRange(s.selectionEnd, s.dataStart, s.dataEnd, s.leftX, s.rightX);
			return pixel >= leftMarkerPx && pixel <= rightMarkerPx;
		},

		// ==================== Helpers ====================

		/**
		 * Get current state snapshot
		 */
		getState(): TimelineState {
			return get({ subscribe });
		},

		/**
		 * Check if timeline has data
		 */
		hasData(): boolean {
			const state = get({ subscribe });
			return state.dataEnd > state.dataStart;
		}
	};
}

// Export singleton store
export const timelineV2Store = createTimelineStore();

// ==================== Derived Stores ====================

/** Current view duration */
export const viewDuration = derived(timelineV2Store, ($t) => $t.viewEnd - $t.viewStart);

/** Total data duration */
export const dataDuration = derived(timelineV2Store, ($t) => $t.dataEnd - $t.dataStart);

/** Current zoom level (1 = no zoom, >1 = zoomed in) */
export const zoomLevel = derived(
	[dataDuration, viewDuration],
	([$data, $view]) => ($view > 0 ? $data / $view : 1)
);

/** Whether timeline is zoomed */
export const isZoomed = derived(zoomLevel, ($z) => $z > 1.01);
