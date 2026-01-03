<script lang="ts">
	import { timelineV2Store, isZoomed, zoomLevel } from '../store';
	import { formatTime } from '../utils';
	import { isPlaying, togglePlayback, pause as pausePlayback } from '../../../stores/playbackStore';
	import ConfigStore from '../../../stores/configStore';
	import P5Store from '../../../stores/p5Store';

	// MDI Icons
	import MdPlayArrow from '~icons/mdi/play-arrow';
	import MdPause from '~icons/mdi/pause';
	import MdSkipPrevious from '~icons/mdi/skip-previous';
	import MdPlus from '~icons/mdi/plus';
	import MdMinus from '~icons/mdi/minus';
	import MdMagnifyPlus from '~icons/mdi/magnify-plus-outline';
	import MdMagnifyMinus from '~icons/mdi/magnify-minus-outline';
	import MdFitToScreen from '~icons/mdi/fit-to-screen-outline';

	/** Speed presets - these map to animationRate values */
	const SPEED_PRESETS = [0.01, 0.025, 0.05, 0.1, 0.2];
	const SPEED_LABELS = ['0.25x', '0.5x', '1x', '2x', '4x'];

	let currentTime = $derived($timelineV2Store.currentTime);
	let viewStart = $derived($timelineV2Store.viewStart);
	let viewEnd = $derived($timelineV2Store.viewEnd);
	let speedIndex = $derived(SPEED_PRESETS.indexOf($ConfigStore.animationRate) ?? 2);
	let p5Instance = $derived($P5Store);

	function reset() {
		pausePlayback();
		timelineV2Store.setCurrentTime($timelineV2Store.viewStart);
	}

	function decreaseSpeed() {
		const currentIdx = SPEED_PRESETS.indexOf($ConfigStore.animationRate);
		if (currentIdx > 0) {
			ConfigStore.update((c) => {
				c.animationRate = SPEED_PRESETS[currentIdx - 1];
				return c;
			});
		}
	}

	function increaseSpeed() {
		const currentIdx = SPEED_PRESETS.indexOf($ConfigStore.animationRate);
		if (currentIdx < SPEED_PRESETS.length - 1) {
			ConfigStore.update((c) => {
				c.animationRate = SPEED_PRESETS[currentIdx + 1];
				return c;
			});
		}
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

<div class="flex items-center gap-4 px-4 py-2 bg-[#f6f5f3] border-t border-gray-200">
	<!-- Playback controls -->
	<div class="flex items-center gap-1">
		<button
			class="btn btn-circle btn-primary btn-sm"
			onclick={togglePlayback}
			title={$isPlaying ? 'Pause (Space)' : 'Play (Space)'}
			aria-label={$isPlaying ? 'Pause' : 'Play'}
		>
			{#if $isPlaying}
				<MdPause class="w-4 h-4" />
			{:else}
				<MdPlayArrow class="w-4 h-4" />
			{/if}
		</button>
		<button
			class="btn btn-ghost btn-square btn-sm"
			onclick={reset}
			title="Reset to start"
			aria-label="Reset"
		>
			<MdSkipPrevious class="w-5 h-5" />
		</button>
	</div>

	<!-- Speed controls -->
	<div class="join border border-gray-200 rounded">
		<button
			class="join-item btn btn-ghost btn-xs px-1.5"
			onclick={decreaseSpeed}
			disabled={speedIndex === 0}
			title="Slower"
			aria-label="Decrease speed"
		>
			<MdMinus class="w-3.5 h-3.5" />
		</button>
		<span class="join-item flex items-center px-2 text-xs font-semibold font-mono bg-white border-x border-gray-200">
			{SPEED_LABELS[speedIndex >= 0 ? speedIndex : 2]}
		</span>
		<button
			class="join-item btn btn-ghost btn-xs px-1.5"
			onclick={increaseSpeed}
			disabled={speedIndex === SPEED_PRESETS.length - 1}
			title="Faster"
			aria-label="Increase speed"
		>
			<MdPlus class="w-3.5 h-3.5" />
		</button>
	</div>

	<!-- Zoom controls -->
	<div class="join border border-gray-200 rounded">
		<button
			class="join-item btn btn-ghost btn-xs px-1.5"
			onclick={zoomOut}
			title="Zoom out (−)"
			aria-label="Zoom out"
		>
			<MdMagnifyMinus class="w-4 h-4" />
		</button>
		<button
			class="join-item btn btn-ghost btn-xs px-1.5"
			onclick={zoomToFit}
			title="Fit to view (0)"
			aria-label="Fit to view"
			disabled={!$isZoomed}
		>
			<MdFitToScreen class="w-4 h-4" />
		</button>
		<button
			class="join-item btn btn-ghost btn-xs px-1.5"
			onclick={zoomIn}
			title="Zoom in (+)"
			aria-label="Zoom in"
		>
			<MdMagnifyPlus class="w-4 h-4" />
		</button>
	</div>
	{#if $isZoomed}
		<span class="text-xs text-gray-500 font-medium">{$zoomLevel.toFixed(1)}x</span>
	{/if}

	<!-- Time display -->
	<div class="flex items-center gap-1.5 ml-auto bg-gray-100 px-3 py-1 rounded-md">
		<span class="font-mono text-base font-semibold text-red-500">{formatTime(currentTime)}</span>
		<span class="text-gray-400">/</span>
		<span class="font-mono text-base text-gray-500">{formatTime(viewEnd - viewStart)}</span>
	</div>
</div>
