<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
	import moment from 'moment';

  import TimelineStore from '../../stores/timelineStore';

	$: timelineLeft = $TimelineStore.getLeftMarker();
	$: timelineRight = $TimelineStore.getRightMarker();
	$: timelineCurr = $TimelineStore.getCurrTime();
  $: startTime = $TimelineStore.getStartTime();
  $: endTime = $TimelineStore.getEndTime();
  $: leftX = $TimelineStore.getLeftX();
  $: rightX = $TimelineStore.getRightX();

	$: formattedLeft = moment.utc(timelineLeft * 1000).format('HH:mm:ss');
  $: formattedRight = moment.utc(timelineRight * 1000).format('HH:mm:ss');
  $: formattedCurr = moment.utc(timelineCurr * 1000).format('HH:mm:ss');

  let loaded = false;
  let sliderContainer: HTMLDivElement;

  // Used to properly type the event used in HandleChange below
  interface SliderChangeEvent extends Event {
    detail: {
      value1: number;
      value2: number;
      value3: number;
    };
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import the slider only on the client side
      import('toolcool-range-slider').then(() => {
        loaded = true;
        const slider = document.querySelector('tc-range-slider');
        if (slider) {
          slider.addEventListener('change', (event: Event) => {
            const target = event.target as HTMLInputElement; // Cast event.target to the proper element type, adjust if it's not HTMLInputElement
            if (target && 'value1' in target && 'value2' in target && 'value3' in target) {
              // Now you can safely use target.value1, target.value2, and target.value3
              TimelineStore.update(timeline => {
                timeline.setLeftMarker(Number(target['value1']));
                timeline.setCurrTime(Number(target['value2']));
                timeline.setRightMarker(Number(target['value3']));
                return timeline;
              });
            }
          });
        }
      });

      window.addEventListener('resize', updateXPositions);
      updateXPositions();
    }
  });

  onDestroy(() => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('resize', updateXPositions);
  });

  const updateXPositions = () => {
    if (sliderContainer) {
      const rect = sliderContainer.getBoundingClientRect();
      const leftX = rect.left; // X position of the left edge of the slider container
      const rightX = rect.right; // X position of the right edge of the slider container

      TimelineStore.update(timeline => {
        timeline.updateXPositions({ leftX, rightX });
        return timeline;
      });
    }
  };


  function handleChange(event: SliderChangeEvent) {
    if (event.detail.value1 === timelineLeft && event.detail.value2 === timelineCurr && event.detail.value3 === timelineRight) {
      return;
    }

    const { value1, value2, value3 } = event.detail;
    TimelineStore.update(timeline => {
      timeline.setLeftMarker(value1);
      timeline.setCurrTime(value2);
      timeline.setRightMarker(value3);

      if (sliderContainer) {
        const rect = sliderContainer.getBoundingClientRect();
        const leftX = rect.left; // X position of the left edge of the slider container
        const rightX = rect.right; // X position of the right edge of the slider container

        timeline.updateXPositions({ leftX, rightX });
      }
      return timeline;
    });
  }

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
        slider-width="90%"
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
