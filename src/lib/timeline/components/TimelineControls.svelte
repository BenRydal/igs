<script lang="ts">
	import { timelineV2Store } from '../store';
	import { formatTime } from 'svelte-interactive-timeline';
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

	// Use store's reactive getters directly
	let currentTime = $derived(timelineV2Store.currentTime);
	let viewDuration = $derived(timelineV2Store.viewDuration);
	let isZoomed = $derived(timelineV2Store.isZoomed);
	let zoomLevel = $derived(timelineV2Store.zoomLevel);

	let speedIndex = $derived.by(() => {
		const idx = SPEED_PRESETS.indexOf($ConfigStore.animationRate);
		return idx >= 0 ? idx : DEFAULT_SPEED_INDEX;
	});
	let p5Instance = $derived($P5Store);

	function reset() {
		pausePlayback();
		timelineV2Store.setCurrentTime(timelineV2Store.viewStart);
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

<div class="flex items-center gap-2 px-2 py-1 bg-[#f6f5f3]">
	<!-- Playback controls -->
	<div class="flex items-center gap-0.5 bg-white border border-gray-200 rounded-full pl-0.5 pr-1 py-0.5">
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
		<span class="w-px h-3 bg-gray-200"></span>
		<button
			class="btn btn-ghost btn-xs px-1 font-mono text-xs font-semibold"
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
			disabled={!isZoomed}
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
	{#if isZoomed}
		<span class="text-xs text-gray-500 font-medium">{zoomLevel.toFixed(1)}x</span>
	{:else}
		<span class="zoom-hint">Drag to zoom</span>
	{/if}

	<!-- Activity gradient toggle (advanced mode only) -->
	{#if $ConfigStore.advancedMode}
		<button
			class="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-gray-200/50 transition-colors cursor-pointer"
			class:opacity-50={!$ConfigStore.showActivityGradient}
			title={$ConfigStore.showActivityGradient ? 'Hide activity gradient' : 'Show activity gradient'}
			onclick={() => ConfigStore.update((c) => ({ ...c, showActivityGradient: !c.showActivityGradient }))}
		>
			<span class="text-[10px] text-gray-400">stopped</span>
			<div class="w-10 h-1.5 rounded-sm" style="background: linear-gradient(to right, rgba(0,0,0,0.1), rgba(0,0,0,0.4))"></div>
			<span class="text-[10px] text-gray-400">moving</span>
		</button>
	{/if}

	<!-- Time display -->
	<div class="flex items-center gap-1 ml-auto font-mono text-xs">
		<span class="font-semibold text-red-500">{formatTime(currentTime)}</span>
		<span class="text-gray-400">/</span>
		<span class="text-gray-500">{formatTime(viewDuration)}</span>
	</div>
</div>

<style>
	.zoom-hint {
		font-size: 0.75rem;
		color: #9ca3af;
		animation: fade-out 15s forwards;
	}

	@keyframes fade-out {
		0%, 80% { opacity: 1; }
		100% { opacity: 0; }
	}
</style>
