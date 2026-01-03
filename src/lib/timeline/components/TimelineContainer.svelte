<script lang="ts">
	import { onMount } from 'svelte';
	import TimelineCanvas from './TimelineCanvas.svelte';
	import TimelineControls from './TimelineControls.svelte';
	import { timelineV2Store } from '../store';

	interface Props {
		/** Initial end time (optional - can also use initialize() method) */
		endTime?: number;
		/** Height of the canvas area in pixels */
		height?: number;
		/** Whether to show controls */
		showControls?: boolean;
		/** Embedded mode - removes border/shadow for use inside other containers */
		embedded?: boolean;
	}

	let { endTime = 0, height = 80, showControls = true, embedded = false }: Props = $props();

	onMount(() => {
		// Initialize with provided endTime if specified
		if (endTime > 0) {
			timelineV2Store.initialize(endTime);
		}
	});

	// Expose store methods for external use
	export function initialize(end: number, start: number = 0) {
		timelineV2Store.initialize(end, start);
	}

	export function setCurrentTime(time: number) {
		timelineV2Store.setCurrentTime(time);
	}
</script>

<div
	class="flex flex-col w-full overflow-hidden border border-gray-200 {embedded
		? 'rounded-md bg-white'
		: 'rounded-lg bg-[#f6f5f3] shadow-sm'}"
>
	<div class="flex-shrink-0 border-b border-gray-200" style="height: {height}px">
		<TimelineCanvas />
	</div>
	{#if showControls}
		<TimelineControls />
	{/if}
</div>
