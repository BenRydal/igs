<script lang="ts">
  import { get } from 'svelte/store'
  import { TimelineTrack } from 'svelte-p5-components'
  import { timelineV2Store, isZoomed } from '../store'
  import { generateGridLines } from '../utils'
  import { activityGradientCss, computeActivityBuckets } from '../activity-gradient'
  import { goToView, MIN_VIEW_SECONDS } from '../view-animation'
  import VideoStore, { requestSeek } from '../../../stores/videoStore'
  import UserStore from '../../../stores/userStore'
  import ConfigStore from '../../../stores/configStore'
  import { redrawCanvas } from '$lib/utils/p5'

  const MAX_TICK_LABELS = 8

  const timeline = $derived($timelineV2Store)
  const duration = $derived(Math.max(timeline.dataEnd, 0.001))
  const ticks = $derived(generateGridLines(timeline.viewStart, timeline.viewEnd, MAX_TICK_LABELS))
  const gradient = $derived(
    $ConfigStore.showActivityGradient
      ? activityGradientCss(computeActivityBuckets($UserStore, 0, timeline.dataEnd))
      : 'none'
  )

  function seek(time: number) {
    timelineV2Store.setCurrentTime(time)
    if (get(VideoStore).isVisible) requestSeek(time)
    redrawCanvas()
  }
</script>

<div class="igs-timeline w-full">
  <div class="igs-timeline-main">
    <TimelineTrack
      {duration}
      currentTime={timeline.currentTime}
      viewStart={timeline.viewStart}
      viewEnd={timeline.viewEnd}
      zoomable
      minViewDuration={MIN_VIEW_SECONDS}
      onSeek={seek}
      onViewChange={goToView}
      onBoundsChange={(bounds) => {
        timelineV2Store.updateXPositions(bounds.left, bounds.right)
        redrawCanvas()
      }}
    >
      {#snippet underlay(view)}
        <div class="igs-timeline-underlay">
          <div
            class="igs-timeline-gradient"
            style:left="{view.timeToPercent(0)}%"
            style:width="{view.timeToPercent(view.duration) - view.timeToPercent(0)}%"
            style:background-image={gradient}
          ></div>
          {#each ticks as tick (tick.time)}
            <span
              class="igs-timeline-tick"
              class:igs-timeline-tick-major={tick.isMajor}
              style:left="{view.timeToPercent(tick.time)}%"
            >
              <span class="igs-timeline-tick-label">{tick.label}</span>
            </span>
          {/each}
        </div>
      {/snippet}
    </TimelineTrack>
  </div>
  <div
    class="igs-timeline-overview"
    title="Whole recording. When zoomed, drag the window to move it or its edges to resize it."
  >
    <TimelineTrack
      {duration}
      currentTime={timeline.currentTime}
      selectionStart={timeline.viewStart}
      selectionEnd={timeline.viewEnd}
      showSelection={$isZoomed}
      onSeek={seek}
      onSelectionChange={(selection) => {
        timelineV2Store.setView(selection.start, selection.end)
        redrawCanvas()
      }}
    />
  </div>
</div>

<style>
  .igs-timeline {
    padding-inline: 12px;
    overflow-x: clip;
  }
  .igs-timeline-main > :global(.timeline-track) {
    --timeline-track-height: 36px;
    --timeline-rail-height: 0px;
    --timeline-rail-height-active: 0px;
    --timeline-playhead-size: 9px;
    --timeline-playhead-size-active: 11px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }
  .igs-timeline-main > :global(.timeline-track .timeline-track__progress) {
    display: none;
  }
  .igs-timeline-overview {
    margin-top: 2px;
  }
  .igs-timeline-overview > :global(.timeline-track) {
    --timeline-track-height: 14px;
    --timeline-rail-height: 4px;
    --timeline-rail-height-active: 4px;
    --timeline-playhead-size: 8px;
    --timeline-playhead-size-active: 8px;
    --timeline-selection-bg: rgba(59, 130, 246, 0.3);
    --timeline-accent: #64748b;
    --timeline-accent-hover: #475569;
  }
  .igs-timeline-underlay {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .igs-timeline-gradient {
    position: absolute;
    bottom: 2px;
    height: 14px;
  }
  .igs-timeline-tick {
    position: absolute;
    top: 0;
    bottom: 0;
    border-left: 1px solid rgba(0, 0, 0, 0.08);
  }
  .igs-timeline-tick-major {
    border-left-color: rgba(0, 0, 0, 0.18);
  }
  .igs-timeline-tick-label {
    position: absolute;
    top: 0;
    left: 3px;
    font-size: 9px;
    line-height: 1;
    color: rgba(0, 0, 0, 0.5);
    white-space: nowrap;
  }
</style>
