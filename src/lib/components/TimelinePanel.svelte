<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import moment from 'moment';
	import TimelineStore from '../../stores/timelineStore';
	import P5Store from '../../stores/p5Store';
	import ConfigStore, { type ConfigStoreType } from '../../stores/configStore';
	import MdFastForward from 'svelte-icons/md/MdFastForward.svelte';
	import MdFastRewind from 'svelte-icons/md/MdFastRewind.svelte';

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

	// Formatting times for display
	$: formattedLeft = moment.utc(timelineLeft * 1000).format('HH:mm:ss');
	$: formattedRight = moment.utc(timelineRight * 1000).format('HH:mm:ss');
	$: formattedCurr = moment.utc(timelineCurr * 1000).format('HH:mm:ss');

	let sliderContainer: HTMLDivElement;
	let loaded = false;

	// Subscribe to ConfigStore to access animationRate
	let config: ConfigStoreType;
	ConfigStore.subscribe((value) => {
		config = value;
	});

	const toggleAnimation = () => {
		TimelineStore.update((timeline) => {
			timeline.setIsAnimating(!timeline.getIsAnimating());
			return timeline;
		});

		if (p5Instance) {
			p5Instance.videoController.timelinePlayPause();
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

		TimelineStore.update((timeline) => {
			timeline.setLeftMarker(value1);
			timeline.setCurrTime(value2);
			timeline.setRightMarker(value3);
			updateXPositions();
			return timeline;
		});
	};

	// Speed control functions
	const speedUp = () => {
		ConfigStore.update((currentConfig) => {
			const newRate = Math.min(currentConfig.animationRate + 0.05, 1); // Cap at 1
			return { ...currentConfig, animationRate: newRate };
		});

		if (p5Instance) p5Instance.loop(); // Trigger redraw if necessary
	};

	const slowDown = () => {
		ConfigStore.update((currentConfig) => {
			const newRate = Math.max(currentConfig.animationRate - 0.05, 0.01); // Floor at 0.01
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
				}
				await tick();
				updateXPositions();
			});

			window.addEventListener('resize', updateXPositions);
		}
	});

	onDestroy(() => {
		if (typeof window === 'undefined') return;
		window.removeEventListener('resize', updateXPositions);
	});
</script>

{#if loaded}
	<div class="flex flex-col w-11/12 h-full py-5">
		<!-- This slider-container div is used to get measurements of the timeline -->
		<div class="slider-container" bind:this={sliderContainer}>
			<tc-range-slider
				min={startTime}
				max={endTime}
				value1={timelineLeft}
				value2={timelineCurr}
				value3={timelineRight}
				round="0"
				slider-width="100%"
				generate-labels="true"
				range-dragging="true"
				pointer-width="25px"
				pointer-height="25px"
				pointer-radius="5px"
				on:change={handleChange}
			/>
		</div>

		<div class="flex w-full mt-2 items-center space-x-4">
			<!-- Slow Down Button -->
			<button on:click={slowDown} class="speed-btn" aria-label="Slow Down">
				<MdFastRewind class="w-6 h-6" />
			</button>

			<!-- Play/Pause Button -->
			<button on:click={toggleAnimation} class="play-pause-btn" aria-label={isAnimating ? 'Pause' : 'Play'}>
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
			<button on:click={speedUp} class="speed-btn" aria-label="Speed Up">
				<MdFastForward class="w-6 h-6" />
			</button>

			<!-- Display Current Time / End Time and Animation Rate -->
			<div class="flex flex-col">
				<p>{formattedCurr}/{formattedRight}</p>
				<p class="text-sm text-gray-600">Speed: {config.animationRate.toFixed(2)}x</p>
			</div>
		</div>
	</div>
{/if}

<style>
	:host {
		width: 100% !important;
	}

	.play-pause-btn,
	.speed-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 50%;
		background-color: #ffffff;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.play-pause-btn:hover,
	.speed-btn:hover {
		background-color: #f0f0f0;
	}

	.play-pause-btn svg,
	.speed-btn svg {
		width: 24px;
		height: 24px;
		color: #000000;
	}

	.flex.space-x-4 > * {
		margin-right: 1rem;
	}

	.flex-col p {
		margin: 0;
	}
</style>
