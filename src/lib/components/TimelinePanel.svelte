<script lang="ts">
  import P5Store from '../../stores/p5Store';
  import { get } from 'svelte/store';

  import type { SketchController } from '..';

  let startTime: number = 0;
  let endTime: number = 100;
  let currentTime: number = 0;

  let sketchController: SketchController | null;

  P5Store.subscribe(state => {
    sketchController = state.sketchController;
    synchronizeTime();
  });

  function synchronizeTime() {
    if (sketchController) {
      currentTime = sketchController.mapTotalTimeToPixelTime(sketchController.animationCounter);
    }
  }

  function updateTime(value: number) {
    if (sketchController) {
      sketchController.animationCounter = sketchController.mapPixelTimeToTotalTime(value);
      // Trigger sketch update if necessary
      sketchController.updateAnimation();
    }
  }

  $: if (sketchController) {
    synchronizeTime();
  }

  // Add more event handlers as needed
</script>

<div class="w-full bg-white">
  <input
    type="range"
    min={startTime}
    max={endTime}
    bind:value={currentTime}
    on:change={() => updateTime(currentTime)}
    class="range"
  />
  <span class="material-symbols-outlined cursor-pointer">play_arrow</span>
</div>
