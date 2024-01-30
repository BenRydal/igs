<script lang="ts">
  import { onMount } from 'svelte';
	import moment from 'moment';

  import TimelineStore from '../../stores/timelineStore';

	$: timelineLeft = $TimelineStore.leftMarker;
	$: timelineRight = $TimelineStore.rightMarker;
	$: timelineCurr = $TimelineStore.currTime;
  $: startTime = $TimelineStore.startTime;
  $: endTime = $TimelineStore.endTime;

	$: formattedLeft = moment.utc(timelineLeft * 1000).format('HH:mm:ss');
  $: formattedRight = moment.utc(timelineRight * 1000).format('HH:mm:ss');
  $: formattedCurr = moment.utc(timelineCurr * 1000).format('HH:mm:ss');

  // // Subscribe to the store and update local variables reactively
  // TimelineStore.subscribe($TimelineStore => {
  //   timelineLeft = $TimelineStore.leftMarker;
  //   timelineRight = $TimelineStore.rightMarker;
  //   timelineCurr = $TimelineStore.currTime;
  // });

  let loaded = false;

  onMount(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import the slider only on the client side
      import('toolcool-range-slider').then(() => {
        loaded = true;
        const slider = document.querySelector('tc-range-slider');
        if (slider) {
          slider.addEventListener('change', (event) => {
            TimelineStore.update(timeline => {
              timeline.leftMarker = event.target.value1;
              timeline.currTime = event.target.value2;
              timeline.rightMarker = event.target.value3;
              return timeline;
            });
          });
        }
      });
    }
  });

  function handleChange(event) {
    const { value1, value2, value3 } = event.detail; // This might need adjustment
    TimelineStore.update(timeline => {
        timeline.leftMarker = value1;
        timeline.currTime = value2;
        timeline.rightMarker = value3;
        return timeline;
    });
	}

</script>

{#if loaded}
  <div class="flex flex-col w-11/12 h-full py-5">
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

    <div class="flex w-full mt-2 justify-between">
      <p>{formattedCurr}/{formattedRight}</p>
      <p>timelineLeft: {formattedLeft}</p>
    </div>
  </div>
{/if}

<style>
  :host {
    width: 100% !important;
  }
</style>
