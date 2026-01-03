<script lang="ts">
	import { timelineV2Store, isZoomed, zoomLevel } from '../store';
	import { formatTime } from '../utils';
	import { isPlaying, togglePlayback, pause as pausePlayback } from '../../../stores/playbackStore';
	import ConfigStore from '../../../stores/configStore';
	import P5Store from '../../../stores/p5Store';

	// MDI Icons
	import MdPlayArrow from '~icons/mdi/play-arrow';
	import MdPause from '~icons/mdi/pause';
	import MdReplay from '~icons/mdi/replay';
	import MdMagnifyPlus from '~icons/mdi/magnify-plus-outline';
	import MdMagnifyMinus from '~icons/mdi/magnify-minus-outline';
	import MdFitToScreen from '~icons/mdi/fit-to-screen-outline';

	/** Speed presets - these map to animationRate values */
	const SPEED_PRESETS = [0.025, 0.05, 0.1, 0.25, 0.5, 1.0];
	const SPEED_LABELS = ['0.5x', '1x', '2x', '5x', '10x', '20x'];
	const DEFAULT_SPEED_INDEX = 1; // 1x

	let currentTime = $derived($timelineV2Store.currentTime);
	let duration = $derived($timelineV2Store.viewEnd - $timelineV2Store.viewStart);
	let speedIndex = $derived.by(() => {
		const idx = SPEED_PRESETS.indexOf($ConfigStore.animationRate);
		return idx >= 0 ? idx : DEFAULT_SPEED_INDEX;
	});
	let p5Instance = $derived($P5Store);

	function reset() {
		pausePlayback();
		timelineV2Store.setCurrentTime($timelineV2Store.viewStart);
	}

	function cycleSpeed(e: MouseEvent) {
		const newIdx = e.shiftKey
			? (speedIndex <= 0 ? SPEED_PRESETS.length - 1 : speedIndex - 1)
			: (speedIndex >= SPEED_PRESETS.length - 1 ? 0 : speedIndex + 1);

		ConfigStore.update((c) => {
			c.animationRate = SPEED_PRESETS[newIdx];
			return c;
		});
	}

	function zoomIn() {
		timelineV2Store.zoom(0.7);
		p5Instance?.loop();
	}

	function zoomOut() {
		timelineV2Store.zoom(1.4);
		p5Instance?.loop();
	}

	function zoomToFit() {
		timelineV2Store.zoomToFit();
		p5Instance?.loop();
	}
</script>

<div class="flex items-center gap-3 px-3 py-1.5 bg-[#f6f5f3] border-t border-gray-200">
	<!-- Playback controls -->
	<div class="flex items-center gap-1 bg-white border border-gray-200 rounded-full pl-0.5 pr-1 py-0.5">
		<button
			class="btn btn-circle btn-primary btn-xs"
			onclick={togglePlayback}
			title={$isPlaying ? 'Pause (Space)' : 'Play (Space)'}
			aria-label={$isPlaying ? 'Pause' : 'Play'}
		>
			{#if $isPlaying}
				<MdPause class="w-3.5 h-3.5" />
			{:else}
				<MdPlayArrow class="w-3.5 h-3.5" />
			{/if}
		</button>
		<button
			class="btn btn-ghost btn-square btn-xs"
			onclick={reset}
			title="Reset to start"
			aria-label="Reset"
		>
			<MdReplay class="w-3.5 h-3.5" />
		</button>
		<span class="w-px h-3.5 bg-gray-200"></span>
		<button
			class="btn btn-ghost btn-xs px-1.5 font-mono font-semibold"
			onclick={cycleSpeed}
			title="Click to change speed (Shift+click for slower)"
			aria-label="Playback speed"
		>
			{SPEED_LABELS[speedIndex]}
		</button>
	</div>

	<!-- Zoom controls -->
	<div class="flex items-center gap-0.5 bg-white border border-gray-200 rounded-full px-0.5 py-0.5">
		<button
			class="btn btn-ghost btn-square btn-xs"
			onclick={zoomOut}
			title="Zoom out (−)"
			aria-label="Zoom out"
		>
			<MdMagnifyMinus class="w-3.5 h-3.5" />
		</button>
		<button
			class="btn btn-ghost btn-square btn-xs"
			onclick={zoomToFit}
			title="Fit to view (0)"
			aria-label="Fit to view"
			disabled={!$isZoomed}
		>
			<MdFitToScreen class="w-3.5 h-3.5" />
		</button>
		<button
			class="btn btn-ghost btn-square btn-xs"
			onclick={zoomIn}
			title="Zoom in (+)"
			aria-label="Zoom in"
		>
			<MdMagnifyPlus class="w-3.5 h-3.5" />
		</button>
	</div>
	{#if $isZoomed}
		<span class="text-xs text-gray-500 font-medium">{$zoomLevel.toFixed(1)}x</span>
	{:else}
		<span class="text-xs text-gray-400">Drag to zoom · Ctrl+scroll to zoom</span>
	{/if}

	<!-- Time display -->
	<div class="flex items-center gap-1 ml-auto bg-gray-100 px-2 py-0.5 rounded">
		<span class="font-mono text-sm font-semibold text-red-500">{formatTime(currentTime)}</span>
		<span class="text-gray-400 text-sm">/</span>
		<span class="font-mono text-sm text-gray-500">{formatTime(duration)}</span>
	</div>
</div>
