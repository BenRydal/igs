/**
 * Timeline Store
 *
 * Singleton timeline store instance using svelte-interactive-timeline library.
 */

import { createTimelineStore } from 'svelte-interactive-timeline';

export const timelineV2Store = createTimelineStore();

export type { TimelineStore, TimelineStoreConfig } from 'svelte-interactive-timeline';
export { createTimelineStore } from 'svelte-interactive-timeline';
