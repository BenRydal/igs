/**
 * Timeline Store
 *
 * Svelte store for managing timeline state with zoom and pan.
 */

import { writable, derived, get } from 'svelte/store';
import type { TimelineState, DragTarget } from './types';
import { clamp, mapRange, zoomAtPoint, panView } from './utils';

/** Initial empty state */
const initialState: TimelineState = {
	// Time bounds
	dataStart: 0,
	dataEnd: 0,

	// View window (controls playback bounds)
	viewStart: 0,
	viewEnd: 0,

	// Playhead
	currentTime: 0,

	// Pixel bounds
	leftX: 0,
	rightX: 0,

	// UI
	hoveredTime: null,
	isDragging: null,

	// Zoom selection
	zoomSelectionStart: null,
	zoomSelectionEnd: null
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
				currentTime: startTime
			}));
		},

		/**
		 * Reset to initial empty state
		 * Preserves leftX/rightX pixel bounds as they depend on DOM layout, not data
		 */
		reset() {
			update((s) => ({
				...initialState,
				leftX: s.leftX,
				rightX: s.rightX
			}));
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

		// ==================== UI State ====================

		/**
		 * Set hover state
		 */
		setHover(time: number | null) {
			update((s) => ({
				...s,
				hoveredTime: time
			}));
		},

		/**
		 * Set drag state
		 */
		setDragging(target: DragTarget) {
			update((s) => ({ ...s, isDragging: target }));
		},

		/**
		 * Set zoom selection range (for drag-to-zoom)
		 */
		setZoomSelection(start: number | null, end: number | null) {
			update((s) => ({ ...s, zoomSelectionStart: start, zoomSelectionEnd: end }));
		},

		/**
		 * Apply zoom selection and clear it
		 */
		applyZoomSelection() {
			update((s) => {
				if (s.zoomSelectionStart !== null && s.zoomSelectionEnd !== null) {
					const start = Math.min(s.zoomSelectionStart, s.zoomSelectionEnd);
					const end = Math.max(s.zoomSelectionStart, s.zoomSelectionEnd);
					// Only zoom if selection is meaningful (> 0.5 seconds)
					if (end - start > 0.5) {
						return {
							...s,
							viewStart: clamp(start, s.dataStart, s.dataEnd),
							viewEnd: clamp(end, s.dataStart, s.dataEnd),
							zoomSelectionStart: null,
							zoomSelectionEnd: null,
							isDragging: null
						};
					}
				}
				return { ...s, zoomSelectionStart: null, zoomSelectionEnd: null, isDragging: null };
			});
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
		 * Get view start pixel position
		 */
		getViewStartPixel(): number {
			const s = get({ subscribe });
			return mapRange(s.viewStart, s.dataStart, s.dataEnd, s.leftX, s.rightX);
		},

		/**
		 * Get view end pixel position
		 */
		getViewEndPixel(): number {
			const s = get({ subscribe });
			return mapRange(s.viewEnd, s.dataStart, s.dataEnd, s.leftX, s.rightX);
		},

		/**
		 * Convert timeline pixel to view-space pixel
		 */
		pixelToViewPixel(pixel: number): number {
			const s = get({ subscribe });
			const viewStartPx = this.getViewStartPixel();
			const viewEndPx = this.getViewEndPixel();
			return mapRange(pixel, s.leftX, s.rightX, viewStartPx, viewEndPx);
		},

		/**
		 * Convert view-space pixel to timeline pixel
		 */
		viewPixelToPixel(pixel: number): number {
			const s = get({ subscribe });
			const viewStartPx = this.getViewStartPixel();
			const viewEndPx = this.getViewEndPixel();
			return mapRange(pixel, viewStartPx, viewEndPx, s.leftX, s.rightX);
		},

		/**
		 * Check if pixel value is within view range
		 */
		overAxis(pixel: number): boolean {
			const viewStartPx = this.getViewStartPixel();
			const viewEndPx = this.getViewEndPixel();
			return pixel >= viewStartPx && pixel <= viewEndPx;
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
