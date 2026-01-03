<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { timelineV2Store } from '../store';
	import { TimelineRenderer } from '../rendering/renderer';
	import type { HitTarget, TimelineState } from '../types';
	import P5Store from '../../../stores/p5Store';
	import VideoStore, { requestSeek } from '../../../stores/videoStore';
	import { isPlaying } from '../../../stores/playbackStore';
	import { HANDLE_HEIGHT, PLAYHEAD_HIT_TOLERANCE } from '../constants';

	/** Canvas element reference */
	let canvas: HTMLCanvasElement;

	/** Renderer instance */
	let renderer: TimelineRenderer | null = null;

	/** Container for resize observer */
	let container: HTMLDivElement;

	/** Current state snapshot for hit testing */
	let currentState: TimelineState;

	/** Pan state */
	let panStartX = 0;
	let panStartViewStart = 0;
	let panStartViewEnd = 0;

	/** p5 instance for triggering redraws */
	let p5Instance = $derived($P5Store);

	/** Subscribe to store changes */
	const unsubscribe = timelineV2Store.subscribe((state) => {
		currentState = state;
		renderer?.setState(state);
	});

	/**
	 * Update the X positions for coordinate transforms.
	 */
	function updateXPositions(): void {
		if (!container) return;

		const rect = container.getBoundingClientRect();
		const leftX = rect.left;
		const rightX = rect.right;

		timelineV2Store.updateXPositions(leftX, rightX);

		// Trigger p5 redraw
		if (p5Instance) {
			p5Instance.loop();
		}
	}

	/**
	 * Sync current time and optionally seek video
	 */
	function syncCurrentTime(time: number): void {
		timelineV2Store.setCurrentTime(time);

		// Seek video if visible and not playing
		const videoState = get(VideoStore);
		const playing = get(isPlaying);
		if (videoState.isVisible && !playing) {
			requestSeek(time);
		}

		// Trigger p5 redraw
		if (p5Instance) {
			p5Instance.loop();
		}
	}

	onMount(() => {
		// Initialize renderer
		renderer = new TimelineRenderer(canvas, currentState);

		// Setup resize observer
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				const { width, height } = entry.contentRect;
				renderer?.resize(width, height);
				// Update X positions for coordinate conversion
				updateXPositions();
			}
		});
		resizeObserver.observe(container);

		// Initial size
		const rect = container.getBoundingClientRect();
		renderer.resize(rect.width, rect.height);

		// Initial X positions update
		updateXPositions();

		// Also update on window resize
		window.addEventListener('resize', updateXPositions);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateXPositions);
		};
	});

	onDestroy(() => {
		unsubscribe();
		renderer?.destroy();
	});

	/**
	 * Hit test to determine what element is at position
	 */
	function hitTest(x: number): HitTarget {
		if (!renderer || !currentState) return 'empty';

		const playheadX = renderer.timeToPixel(currentState.currentTime);

		// Playhead (full height, including handle area)
		if (Math.abs(x - playheadX) < PLAYHEAD_HIT_TOLERANCE) {
			return 'playhead';
		}

		// Track area (clicking anywhere else seeks)
		return 'track';
	}

	/**
	 * Get cursor style for hit target
	 */
	function getCursor(target: HitTarget): string {
		switch (target) {
			case 'playhead':
				return 'grab';
			case 'track':
				return 'pointer';
			default:
				return 'default';
		}
	}

	/**
	 * Pointer down handler
	 */
	function onPointerDown(e: PointerEvent) {
		if (!renderer) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const time = renderer.pixelToTime(x);

		const target = hitTest(x);

		switch (target) {
			case 'playhead':
				timelineV2Store.setDragging('playhead');
				canvas.style.cursor = 'grabbing';
				break;

			case 'track':
				// Middle click or alt+click to pan
				if (e.button === 1 || e.altKey) {
					timelineV2Store.setDragging('pan');
					panStartX = x;
					panStartViewStart = currentState.viewStart;
					panStartViewEnd = currentState.viewEnd;
					canvas.style.cursor = 'grabbing';
				} else {
					// Click to seek
					syncCurrentTime(time);
					// Also start dragging playhead
					timelineV2Store.setDragging('playhead');
					canvas.style.cursor = 'grabbing';
				}
				break;

			case 'empty':
				break;
		}

		canvas.setPointerCapture(e.pointerId);
	}

	/**
	 * Pointer move handler
	 */
	function onPointerMove(e: PointerEvent) {
		if (!renderer) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const time = renderer.pixelToTime(x);

		if (currentState.isDragging) {
			switch (currentState.isDragging) {
				case 'playhead':
					syncCurrentTime(time);
					break;

				case 'pan': {
					const deltaX = x - panStartX;
					const viewDuration = panStartViewEnd - panStartViewStart;
					const deltaTime = -(deltaX / renderer.width) * viewDuration;
					const newStart = panStartViewStart + deltaTime;
					const newEnd = panStartViewEnd + deltaTime;
					timelineV2Store.setView(newStart, newEnd);
					break;
				}
			}
		} else {
			// Update hover state
			if (y >= 0 && y <= renderer.height) {
				timelineV2Store.setHover(time);
			} else {
				timelineV2Store.setHover(null);
			}

			// Update cursor based on what's under mouse
			const target = hitTest(x);
			canvas.style.cursor = getCursor(target);
		}
	}

	/**
	 * Pointer up handler
	 */
	function onPointerUp(e: PointerEvent) {
		if (currentState.isDragging) {
			timelineV2Store.setDragging(null);
			canvas.releasePointerCapture(e.pointerId);

			// Reset cursor
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const target = hitTest(x);
			canvas.style.cursor = getCursor(target);
		}
	}

	/**
	 * Pointer leave handler
	 */
	function onPointerLeave() {
		if (!currentState.isDragging) {
			timelineV2Store.setHover(null);
		}
	}

	/**
	 * Wheel handler for zoom/pan
	 */
	function onWheel(e: WheelEvent) {
		if (!renderer) return;
		e.preventDefault();

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const centerTime = renderer.pixelToTime(x);

		if (e.ctrlKey || e.metaKey) {
			// Zoom centered on mouse position
			const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;
			timelineV2Store.zoom(zoomFactor, centerTime);
		} else if (e.shiftKey) {
			// Horizontal scroll
			const viewDuration = currentState.viewEnd - currentState.viewStart;
			const panAmount = (e.deltaY / renderer.width) * viewDuration * 0.5;
			timelineV2Store.pan(panAmount);
		} else {
			// Default: horizontal pan
			const viewDuration = currentState.viewEnd - currentState.viewStart;
			const panAmount = (e.deltaY / renderer.width) * viewDuration * 0.3;
			timelineV2Store.pan(panAmount);
		}

		// Trigger p5 redraw to update visualization
		if (p5Instance) {
			p5Instance.loop();
		}
	}
</script>

<div bind:this={container} class="w-full h-full min-h-10 relative">
	<canvas
		bind:this={canvas}
		class="block w-full h-full touch-none"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointerleave={onPointerLeave}
		onwheel={onWheel}
	></canvas>
</div>
