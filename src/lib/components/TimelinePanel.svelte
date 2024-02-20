<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import moment from 'moment';
  import TimelineStore from '../../stores/timelineStore';
  import P5Store from '../../stores/p5Store';

  let p5Instance;

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

  // Formatting times for display
  $: formattedLeft = moment.utc(timelineLeft * 1000).format('HH:mm:ss');
  $: formattedRight = moment.utc(timelineRight * 1000).format('HH:mm:ss');
  $: formattedCurr = moment.utc(timelineCurr * 1000).format('HH:mm:ss');

  let sliderContainer: HTMLDivElement;
  let loaded = false;

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

    TimelineStore.update(timeline => {
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

    TimelineStore.update(timeline => {
      timeline.setLeftMarker(value1);
      timeline.setCurrTime(value2);
      timeline.setRightMarker(value3);
      updateXPositions();
      return timeline;
    });
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

    <div class="flex w-full mt-2 justify-between">
      <p>{formattedCurr}/{formattedRight}</p>
      <p>timelineLeft: {formattedLeft}</p>
      <p>leftX: {leftX} | rightX: {rightX}</p>
    </div>
  </div>
{/if}

<style>
  :host {
    width: 100% !important;
  }
</style>
