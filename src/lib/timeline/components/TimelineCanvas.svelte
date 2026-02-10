<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { timelineV2Store } from '../store';
	import { TimelineRenderer } from '../rendering/renderer';
	import { defaultLayoutConfig, type HitTarget } from 'svelte-interactive-timeline';
	import P5Store from '../../../stores/p5Store';
	import VideoStore, { requestSeek } from '../../../stores/videoStore';
	import UserStore from '../../../stores/userStore';
	import ConfigStore from '../../../stores/configStore';

	const PLAYHEAD_HIT_TOLERANCE = defaultLayoutConfig.playheadHitTolerance;
	const DRAG_THRESHOLD = defaultLayoutConfig.dragThreshold;

	/** Canvas element reference */
	let canvas: HTMLCanvasElement;

	/** Renderer instance */
	let renderer: TimelineRenderer | null = null;

	/** Container for resize observer */
	let container: HTMLDivElement;

	/** Pan state */
	let panStartX = 0;
	let panStartViewStart = 0;
	let panStartViewEnd = 0;

	/** Zoom region state */
	let zoomStartX = 0;

	/** p5 instance for triggering redraws */
	let p5Instance = $derived($P5Store);

	// Use $effect to react to timeline store changes and update renderer
	$effect(() => {
		const state = timelineV2Store.getState();
		renderer?.setState(state);
	});

	// React to user store changes (for activity gradient)
	$effect(() => {
		$UserStore;
		renderer?.requestRender();
	});

	// React to config store changes (e.g., activity gradient toggle)
	$effect(() => {
		$ConfigStore;
		renderer?.requestRender();
	});

	/**
	 * Update the X positions for coordinate transforms.
	 */
	function updateXPositions(): void {
		if (!container) return;

		const rect = container.getBoundingClientRect();
		timelineV2Store.updateXPositions(rect.left, rect.right);

		// Trigger p5 redraw
		p5Instance?.loop();
	}

	/**
	 * Sync current time and optionally seek video
	 */
	function syncCurrentTime(time: number): void {
		timelineV2Store.setCurrentTime(time);

		// Seek video if visible
		const videoState = get(VideoStore);
		if (videoState.isVisible) {
			requestSeek(time);
		}

		// Trigger p5 redraw
		p5Instance?.loop();
	}

	onMount(() => {
		// Initialize renderer with current state
		renderer = new TimelineRenderer(canvas, timelineV2Store.getState());

		// Setup resize observer
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				const { width, height } = entry.contentRect;
				renderer?.resize(width, height);
				updateXPositions();
			}
		});
		resizeObserver.observe(container);

		// Initial size
		const rect = container.getBoundingClientRect();
		renderer.resize(rect.width, rect.height);
		updateXPositions();

		// Also update on window resize
		window.addEventListener('resize', updateXPositions);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', updateXPositions);
		};
	});

	onDestroy(() => {
		renderer?.destroy();
	});

	/**
	 * Hit test to determine what element is at position
	 */
	function hitTest(x: number): HitTarget {
		if (!renderer) return 'empty';

		const playheadX = renderer.timeToPixel(timelineV2Store.currentTime);

		if (Math.abs(x - playheadX) < PLAYHEAD_HIT_TOLERANCE) {
			return 'playhead';
		}

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
		const time = renderer.pixelToTime(x);

		switch (hitTest(x)) {
			case 'playhead':
				timelineV2Store.setDragging('playhead');
				canvas.style.cursor = 'grabbing';
				break;

			case 'track':
				if (e.button === 1 || e.altKey) {
					// Middle click or alt+click to pan
					timelineV2Store.setDragging('pan');
					panStartX = x;
					panStartViewStart = timelineV2Store.viewStart;
					panStartViewEnd = timelineV2Store.viewEnd;
					canvas.style.cursor = 'grabbing';
				} else {
					// Start potential zoom region
					timelineV2Store.setDragging('zoom-region');
					timelineV2Store.setZoomSelection(time, time);
					zoomStartX = x;
					canvas.style.cursor = 'crosshair';
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

		if (timelineV2Store.isDragging) {
			switch (timelineV2Store.isDragging) {
				case 'playhead':
					syncCurrentTime(time);
					break;

				case 'pan': {
					const deltaX = x - panStartX;
					const viewDuration = panStartViewEnd - panStartViewStart;
					const deltaTime = -(deltaX / renderer.width) * viewDuration;
					timelineV2Store.setView(
						panStartViewStart + deltaTime,
						panStartViewEnd + deltaTime
					);
					break;
				}

				case 'zoom-region':
					timelineV2Store.setZoomSelection(timelineV2Store.zoomSelectionStart, time);
					break;
			}
		} else {
			// Update hover state
			if (y >= 0 && y <= renderer.height) {
				timelineV2Store.setHover(time);
			} else {
				timelineV2Store.setHover(null);
			}

			// Update cursor
			canvas.style.cursor = getCursor(hitTest(x));
		}
	}

	/**
	 * Pointer up handler
	 */
	function onPointerUp(e: PointerEvent) {
		if (!renderer || !timelineV2Store.isDragging) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;

		if (timelineV2Store.isDragging === 'zoom-region') {
			const dragDistance = Math.abs(x - zoomStartX);

			if (dragDistance < DRAG_THRESHOLD) {
				// Click - seek to position
				syncCurrentTime(renderer.pixelToTime(x));
				timelineV2Store.setZoomSelection(null, null);
				timelineV2Store.setDragging(null);
			} else {
				// Drag - apply zoom
				timelineV2Store.applyZoomSelection();
				p5Instance?.loop();
			}
		} else {
			timelineV2Store.setDragging(null);
		}

		canvas.releasePointerCapture(e.pointerId);
		canvas.style.cursor = getCursor(hitTest(x));
	}

	/**
	 * Pointer leave handler
	 */
	function onPointerLeave() {
		if (!timelineV2Store.isDragging) {
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
		} else {
			// Pan
			const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
			const panAmount = (delta / renderer.width) * timelineV2Store.viewDuration * 0.5;
			timelineV2Store.pan(panAmount);
		}

		p5Instance?.loop();
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
