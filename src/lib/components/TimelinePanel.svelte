<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import moment from 'moment';

  let timelineLeft = writable(0); // Initial value for first slider
  let timelineRight = writable(100); // Initial value for second slider
  let timelineCurr = writable(0);
  let loaded = false;

  onMount(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import the slider only on the client side
      import('toolcool-range-slider').then(() => {
        loaded = true;
        const slider = document.querySelector('tc-range-slider');
        if (slider) {
          slider.addEventListener('change', (event) => {
            // Assuming the event gives you access to both slider values
            // Update this part according to how your slider's change event works
            timelineLeft.set(event.target.value1);
            timelineRight.set(event.target.value2);
            timelineCurr.set(0);
          });
        }
      });
    }
  });

  function handleChange(event) {
    // Update this part according to how your slider's change event works
    timelineLeft.set(event.detail.value1);
    timelineCurr.set(event.detail.value2);
    timelineRight.set(event.detail.value3);
  }
</script>

{#if loaded}
  <div class='flex flex-col w-full h-full py-5'>
    <tc-range-slider
      min="0"
      max="100"
      value1={$timelineLeft}
      value2={$timelineCurr}
      value3={$timelineRight}
      round="0"
      slider-width="100%"
      generate-labels="true"
      range-dragging="true"
      pointer-width="25px"
      pointer-height="25px"
      pointer-radius="5px"
      on:change={handleChange}>
    </tc-range-slider>

    <div class='flex w-full mt-2 justify-between'>
      <p>{moment($timelineLeft).format('HH:mm:ss')}/{$timelineRight}</p>
      <p>timelineLeft: {$timelineLeft}</p>
    </div>
  </div>

{/if}


<style>


  :host {
    width: 100% !important;
  }

</style>