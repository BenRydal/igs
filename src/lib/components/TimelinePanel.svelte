<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import TimelineStore from '../../stores/timelineStore';
	import P5Store from '../../stores/p5Store';
	import ConfigStore, { type ConfigStoreType } from '../../stores/configStore';
	import MdFastForward from 'svelte-icons/md/MdFastForward.svelte';
	import MdFastRewind from 'svelte-icons/md/MdFastRewind.svelte';
	import { TimeUtils } from '../core/time-utils';
	import type p5 from 'p5';

	let p5Instance: p5 | null = null;

	P5Store.subscribe((value) => {
		p5Instance = value;
	});

	// Reactive declarations for store values
	$: timelineLeft = $TimelineStore.getLeftMarker();
	$: timelineRight = $TimelineStore.getRightMarker();
	$: timelineCurr = $TimelineStore.getCurrTime();
	$: startTime = $TimelineStore.getStartTime();
	$: endTime = $TimelineStore.getEndTime();
	$: leftX = $TimelineStore.getLeftX();
	$: rightX = $TimelineStore.getRightX();
	$: isAnimating = $TimelineStore.getIsAnimating();

	// Time format handling
	type TimeFormat = 'HHMMSS' | 'MMSS' | 'SECONDS' | 'DECIMAL';
	let currentTimeFormat: TimeFormat = 'HHMMSS';

	// Format time based on selected format
	function formatTimeDisplay(seconds: number): string {
		switch (currentTimeFormat) {
			case 'HHMMSS':
				return TimeUtils.formatTime(seconds);
			case 'MMSS':
				return TimeUtils.formatTimeAuto(seconds);
			case 'SECONDS':
				return `${Math.round(seconds)}s`;
			case 'DECIMAL':
				return seconds.toFixed(1) + 's';
			default:
				return TimeUtils.formatTimeAuto(seconds);
		}
	}

	// Cycle through available time formats
	function cycleTimeFormat() {
		const formats: TimeFormat[] = ['HHMMSS', 'MMSS', 'SECONDS', 'DECIMAL'];
		const currentIndex = formats.indexOf(currentTimeFormat);
		const nextIndex = (currentIndex + 1) % formats.length;
		currentTimeFormat = formats[nextIndex];
	}

	// Reactive declarations for formatted times
	$: formattedLeft = formatTimeDisplay(timelineLeft);
	$: formattedRight = formatTimeDisplay(timelineRight);
	$: formattedCurr = formatTimeDisplay(timelineCurr);

	// Hover and drag states
	let isHoveringPlayhead = false;
	let isHoveringLeft = false;
	let isHoveringRight = false;
	let isDragging = false;
	let showTimeTooltip = false;
	let tooltipX = 0;
	let tooltipTime = '';

	// Update formatted times when time format changes
	$: {
		if (currentTimeFormat) {
			formattedLeft = formatTimeDisplay(timelineLeft);
			formattedRight = formatTimeDisplay(timelineRight);
			formattedCurr = formatTimeDisplay(timelineCurr);
		}
	}

	let sliderContainer: HTMLDivElement;
	let loaded = false;
	let debounceTimeout: ReturnType<typeof setTimeout>;

	// Subscribe to ConfigStore to access animationRate
	let config: ConfigStoreType;
	ConfigStore.subscribe((value) => {
		config = value;
	});

	const toggleAnimation = () => {
		TimelineStore.update((timeline) => {
			// If we're at the end and not animating, reset to beginning
			if (!timeline.getIsAnimating() && timeline.getCurrTime() >= timeline.getEndTime()) {
				timeline.setCurrTime(timeline.getStartTime());
			}
			timeline.setIsAnimating(!timeline.getIsAnimating());
			return timeline;
		});

		if (p5Instance) {
			// Check if videoController exists on p5Instance before accessing it
			if ((p5Instance as any).videoController &&
				typeof (p5Instance as any).videoController.timelinePlayPause === 'function') {
				(p5Instance as any).videoController.timelinePlayPause();
			}
			p5Instance.loop();
		}
	};

	/**
	 * Updates the X positions based on the current dimensions of the slider container.
	 * This function is called whenever the window is resized or the slider container is mounted.
	 */
	const updateXPositions = (): void => {
		if (!sliderContainer) {
			console.warn('Slider container not available.');
			loaded = false; // Ensure loaded is false if sliderContainer is not available
			return;
		}

		const rect = sliderContainer.getBoundingClientRect();
		const leftX = rect.left;
		const rightX = rect.right;

		TimelineStore.update((timeline) => {
			timeline.updateXPositions({ leftX, rightX });
			return timeline;
		});

		if (p5Instance) p5Instance.loop(); // loop after any update once sketch is defined
		loaded = true; // Set loaded to true after successful update
	};

	// Used to properly type the event used in handleChange
	interface SliderChangeEvent extends Event {
		detail: {
			value1: number;
			value2: number;
			value3: number;
		};
	}

	/**
	 * Handles changes in the range slider, updating the timeline markers and X positions accordingly.
	 * @param {SliderChangeEvent} event - The event object emitted by the range slider on change.
	 */
	const handleChange = (event: SliderChangeEvent): void => {
		const { value1, value2, value3 } = event.detail;
		if (value1 === timelineLeft && value2 === timelineCurr && value3 === timelineRight) {
			return;
		}

		if (!isAnimating && p5Instance) {
			clearTimeout(debounceTimeout);
			debounceTimeout = setTimeout(() => {
				// Check if fillSelectedData exists on p5Instance before calling it
				if (p5Instance && typeof (p5Instance as any).fillSelectedData === 'function') {
					(p5Instance as any).fillSelectedData();
				}
			}, 100);
		}

		TimelineStore.update((timeline) => {
			timeline.setLeftMarker(value1);
			timeline.setCurrTime(value2);
			timeline.setRightMarker(value3);
			updateXPositions();
			return timeline;
		});
	};

	// Handle mouse events for time tooltip
	const handleMouseMove = (e: MouseEvent) => {
		if (sliderContainer && (isHoveringPlayhead || isHoveringLeft || isHoveringRight || isDragging)) {
			const rect = sliderContainer.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const percentage = x / rect.width;
			const time = startTime + (endTime - startTime) * percentage;
			
			tooltipX = e.clientX - rect.left;
			tooltipTime = formatTimeDisplay(Math.max(startTime, Math.min(endTime, time)));
			showTimeTooltip = true;
		}
	};

	const handleMouseLeave = () => {
		if (!isDragging) {
			showTimeTooltip = false;
			isHoveringPlayhead = false;
			isHoveringLeft = false;
			isHoveringRight = false;
		}
	};

	// Speed control functions
	const speedUp = () => {
		ConfigStore.update((currentConfig) => {
			const newRate = Math.min(currentConfig.animationRate + 0.01, 0.08); // Cap at 0.08 (4x normal speed)
			return { ...currentConfig, animationRate: newRate };
		});

		if (p5Instance) p5Instance.loop(); // Trigger redraw if necessary
	};

	const slowDown = () => {
		ConfigStore.update((currentConfig) => {
			const newRate = Math.max(currentConfig.animationRate - 0.01, 0.005); // Floor at 0.005 (0.25x normal speed)
			return { ...currentConfig, animationRate: newRate };
		});

		if (p5Instance) p5Instance.loop(); // Trigger redraw if necessary
	};

	onMount(async () => {
		if (typeof window !== 'undefined') {
			// Dynamically import the slider only on the client side
			import('toolcool-range-slider').then(async () => {
				loaded = true;
				const slider = document.querySelector('tc-range-slider');
				if (slider) {
					slider.addEventListener('change', (event: Event) => {
						handleChange(event as SliderChangeEvent);
					});

					// Add pointer event listeners
					const pointers = slider.querySelectorAll('tc-range-slider-pointer');
					if (pointers.length >= 3) {
						// Left marker
						pointers[0].addEventListener('mouseenter', () => { isHoveringLeft = true; });
						pointers[0].addEventListener('mouseleave', () => { isHoveringLeft = false; });
						
						// Playhead
						pointers[1].addEventListener('mouseenter', () => { isHoveringPlayhead = true; });
						pointers[1].addEventListener('mouseleave', () => { isHoveringPlayhead = false; });
						
						// Right marker
						pointers[2].addEventListener('mouseenter', () => { isHoveringRight = true; });
						pointers[2].addEventListener('mouseleave', () => { isHoveringRight = false; });
						
						// Drag events
						slider.addEventListener('mousedown', () => { isDragging = true; });
						window.addEventListener('mouseup', () => { 
							isDragging = false;
							showTimeTooltip = false;
						});
					}
				}
				await tick();
				updateXPositions();
			});

			window.addEventListener('resize', updateXPositions);
			window.addEventListener('mousemove', handleMouseMove);
		}
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.removeEventListener('resize', updateXPositions);
		window.removeEventListener('mousemove', handleMouseMove);
	});
</script>

{#if loaded}
	<div class="flex flex-col w-11/12 py-1">
		<!-- This slider-container div is used to get measurements of the timeline -->
		<div 
			class="slider-container" 
			bind:this={sliderContainer}
			on:mouseleave={handleMouseLeave}
		>
			<tc-range-slider
				min={startTime}
				max={endTime}
				value1={timelineLeft}
				value2={timelineCurr}
				value3={timelineRight}
				round="0"
				slider-width="100%"
				generate-labels="false"
				range-dragging="true"
				pointer1-width="8px"
				pointer1-height="20px"
				pointer1-radius="2px"
				pointer2-width="8px"
				pointer2-height="36px"
				pointer2-radius="1px"
				pointer3-width="8px"
				pointer3-height="20px"
				pointer3-radius="2px"
				slider-height="6px"
				slider-radius="3px"
				slider-bg="#e2e8f0"
				slider-bg-hover="#e2e8f0"
				slider-bg-fill="#64748b"
				on:change={handleChange}
				class="timeline-slider"
				style="--value1-percent: {((timelineLeft - startTime) / (endTime - startTime)) * 100}%; --value3-percent: {((timelineRight - startTime) / (endTime - startTime)) * 100}%;"
			/>
			{#if showTimeTooltip}
				<div 
					class="time-tooltip"
					style="left: {tooltipX}px;"
				>
					{tooltipTime}
				</div>
			{/if}
		</div>

		<div class="flex w-full mt-1 items-center space-x-4 pb-1">
			<!-- Slow Down Button -->
			<button on:click={slowDown} class="speed-btn" aria-label="Slow Down" style="background: white;">
				<div class="w-6 h-6" style="display: flex; align-items: center; justify-content: center;">
					<MdFastRewind />
				</div>
			</button>

			<!-- Play/Pause Button -->
			<button on:click={toggleAnimation} class="play-pause-btn" aria-label={isAnimating ? 'Pause' : 'Play'} style="background: white;">
				{#if isAnimating}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
						<path
							fill-rule="evenodd"
							d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
						<path
							fill-rule="evenodd"
							d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
			</button>

			<!-- Speed Up Button -->
			<button on:click={speedUp} class="speed-btn" aria-label="Speed Up" style="background: white;">
				<div class="w-6 h-6" style="display: flex; align-items: center; justify-content: center;">
					<MdFastForward />
				</div>
			</button>

			<!-- Display Current Time / End Time and Animation Rate with clickable time format -->
			<div class="flex flex-col items-start">
				<button
					class="time-display hover:bg-gray-100 rounded px-2 transition-colors h-6 flex items-center"
					on:click={cycleTimeFormat}
					title="Click to change time format"
				>
					<span class="font-mono text-sm">Range: {formattedLeft} – {formattedRight} | Current: {formattedCurr}</span>
				</button>
					<span class="text-sm text-gray-600 px-2">Animation Speed: {(config.animationRate / 0.02).toFixed(2)}x</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.time-display {
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.time-display:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	:host {
		width: 100% !important;
	}

	.play-pause-btn,
	.speed-btn {
		display: flex !important;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		min-width: 36px;
		min-height: 36px;
		border: 1px solid #e5e7eb;
		border-radius: 50%;
		background-color: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: background-color 0.2s;
		flex-shrink: 0;
	}

	.play-pause-btn:hover,
	.speed-btn:hover {
		background-color: #f0f0f0;
	}

	.play-pause-btn svg,
	.speed-btn svg,
	.speed-btn :global(svg),
	.play-pause-btn :global(svg) {
		width: 24px;
		height: 24px;
		color: #000000;
	}

	.flex.space-x-4 > :not(:last-child) {
		margin-right: 1rem;
	}

	.flex-col p {
		margin: 0;
	}

	/* Enhanced timeline styles */
	.slider-container {
		position: relative;
		padding: 8px 0 4px 0;
	}

	/* Custom timeline slider overrides */
	:global(.timeline-slider) {
		--pointer-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	/* Left and right segment markers */
	:global(.timeline-slider tc-range-slider-pointer:nth-child(1)),
	:global(.timeline-slider tc-range-slider-pointer:nth-child(3)) {
		background-color: #3b82f6;
		box-shadow: var(--pointer-shadow);
		transition: transform 0.15s ease, background-color 0.15s ease;
	}

	:global(.timeline-slider tc-range-slider-pointer:nth-child(1):hover),
	:global(.timeline-slider tc-range-slider-pointer:nth-child(3):hover) {
		background-color: #2563eb;
		transform: scaleY(1.1);
	}

	/* Playhead (center pointer) */
	:global(.timeline-slider tc-range-slider-pointer:nth-child(2)) {
		background-color: #ef4444;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
		z-index: 10;
		position: relative;
		cursor: grab;
	}

	/* Triangle on top of playhead */
	:global(.timeline-slider tc-range-slider-pointer:nth-child(2))::before {
		content: '';
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-bottom: 10px solid #ef4444;
	}

	/* Visual line through playhead */
	:global(.timeline-slider tc-range-slider-pointer:nth-child(2))::after {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 2px;
		height: 100%;
		background-color: #ef4444;
	}

	:global(.timeline-slider tc-range-slider-pointer:nth-child(2):hover) {
		transform: scaleX(1.2);
		cursor: grab;
	}

	:global(.timeline-slider tc-range-slider-pointer:nth-child(2):active) {
		cursor: grabbing;
	}

	/* Container for grayed out areas */
	:global(.timeline-slider) {
		position: relative;
	}

	/* Grayed out areas - create overlays for non-selected regions */
	:global(.timeline-slider)::before,
	:global(.timeline-slider)::after {
		content: '';
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		height: 6px;
		background-color: rgba(0, 0, 0, 0.15);
		pointer-events: none;
		z-index: 1;
		border-radius: 3px;
	}

	:global(.timeline-slider)::before {
		left: 0;
		width: var(--value1-percent, 0%);
	}

	:global(.timeline-slider)::after {
		right: 0;
		left: var(--value3-percent, 100%);
		width: auto;
	}

	/* Time tooltip */
	.time-tooltip {
		position: absolute;
		top: -30px;
		transform: translateX(-50%);
		background-color: #1e293b;
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-family: monospace;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.time-tooltip::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 4px solid #1e293b;
	}
</style>
