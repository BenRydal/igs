/**
 * Timeline Store
 *
 * Thin wrapper around the shared library's createTimelineStore.
 * Re-exports with the same names so all consumer files keep working.
 */

import { derived } from 'svelte/store';
import { createTimelineStore } from 'svelte-interactive-timeline';

// Create singleton store using the shared library
export const timelineV2Store = createTimelineStore();

// Derived stores for backward compatibility
// These use Svelte's derived() with the store's .subscribe() method
export const viewDuration = derived(timelineV2Store, ($t) => $t.viewEnd - $t.viewStart);
export const dataDuration = derived(timelineV2Store, ($t) => $t.dataEnd - $t.dataStart);
export const zoomLevel = derived(
	[dataDuration, viewDuration],
	([$data, $view]) => ($view > 0 ? $data / $view : 1)
);
export const isZoomed = derived(zoomLevel, ($z) => $z > 1.01);
