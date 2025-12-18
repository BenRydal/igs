<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte'
  import TimelineStore from '../../stores/timelineStore'
  import P5Store from '../../stores/p5Store'
  import ConfigStore, { type ConfigStoreType } from '../../stores/configStore'
  import MdRefresh from '~icons/mdi/refresh'
  import { TimeUtils } from '../core/time-utils'
  import type p5 from 'p5'

  let p5Instance = $state<p5 | null>(null)

  $effect(() => {
    p5Instance = $P5Store
  })

  // Reactive declarations for store values
  let timelineLeft = $derived($TimelineStore.getLeftMarker())
  let timelineRight = $derived($TimelineStore.getRightMarker())
  let timelineCurr = $derived($TimelineStore.getCurrTime())
  let startTime = $derived($TimelineStore.getStartTime())
  let endTime = $derived($TimelineStore.getEndTime())
  let isAnimating = $derived($TimelineStore.getIsAnimating())

  // Progress fill calculations
  let leftMarkerPercent = $derived(
    endTime > startTime ? ((timelineLeft - startTime) / (endTime - startTime)) * 100 : 0
  )
  let currTimePercent = $derived(
    endTime > startTime ? ((timelineCurr - startTime) / (endTime - startTime)) * 100 : 0
  )
  let fillWidth = $derived(
    timelineCurr >= timelineLeft && timelineCurr <= timelineRight
      ? Math.max(0, currTimePercent - leftMarkerPercent)
      : 0
  )

  // Time format handling
  type TimeFormat = 'HHMMSS' | 'MMSS' | 'SECONDS' | 'DECIMAL'
  let currentTimeFormat = $state<TimeFormat>('MMSS')

  function formatTimeDisplay(seconds: number): string {
    switch (currentTimeFormat) {
      case 'HHMMSS':
        return TimeUtils.formatTime(seconds)
      case 'MMSS':
        return TimeUtils.formatTimeAuto(seconds)
      case 'SECONDS':
        return `${Math.round(seconds)}s`
      case 'DECIMAL':
        return seconds.toFixed(1) + 's'
      default:
        return TimeUtils.formatTimeAuto(seconds)
    }
  }

  function cycleTimeFormat() {
    const formats: TimeFormat[] = ['HHMMSS', 'MMSS', 'SECONDS', 'DECIMAL']
    const currentIndex = formats.indexOf(currentTimeFormat)
    const nextIndex = (currentIndex + 1) % formats.length
    currentTimeFormat = formats[nextIndex]
  }

  // Formatted times
  let formattedLeft = $derived(formatTimeDisplay(timelineLeft))
  let formattedRight = $derived(formatTimeDisplay(timelineRight))
  let formattedCurr = $derived(formatTimeDisplay(timelineCurr))

  let sliderContainer = $state<HTMLDivElement>()
  let loaded = $state(false)

  // Subscribe to ConfigStore to access animationRate
  let config = $state<ConfigStoreType>($ConfigStore)
  $effect(() => {
    config = $ConfigStore
  })

  // Speed presets
  const SPEED_PRESETS = [0.25, 0.5, 1, 2, 4]
  let speedLabel = $derived(
    config.animationRate < 1 ? `${config.animationRate}x` : `${Math.round(config.animationRate)}x`
  )

  const toggleAnimation = () => {
    TimelineStore.update((timeline) => {
      // If we're at the end and not animating, reset to beginning
      if (!timeline.getIsAnimating() && timeline.getCurrTime() >= timeline.getRightMarker()) {
        timeline.setCurrTime(timeline.getLeftMarker())
      }
      timeline.setIsAnimating(!timeline.getIsAnimating())
      return timeline
    })

    if (p5Instance) {
      if (
        (p5Instance as any).videoController &&
        typeof (p5Instance as any).videoController.timelinePlayPause === 'function'
      ) {
        ;(p5Instance as any).videoController.timelinePlayPause()
      }
      p5Instance.loop()
    }
  }

  const resetToStart = () => {
    TimelineStore.update((timeline) => {
      timeline.setCurrTime(timeline.getLeftMarker())
      return timeline
    })

    if (p5Instance) {
      p5Instance.loop()
    }
  }

  const updateXPositions = (): void => {
    if (!sliderContainer) {
      loaded = false
      return
    }

    const rect = sliderContainer.getBoundingClientRect()
    const leftX = rect.left
    const rightX = rect.right

    TimelineStore.update((timeline) => {
      timeline.updateXPositions({ leftX, rightX })
      return timeline
    })

    if (p5Instance) p5Instance.loop()
    loaded = true
  }

  interface SliderChangeEvent extends Event {
    detail: {
      value1: number
      value2: number
      value3: number
    }
  }

  const handleChange = (event: SliderChangeEvent): void => {
    const { value1, value2, value3 } = event.detail

    if (value1 === timelineLeft && value2 === timelineCurr && value3 === timelineRight) {
      return
    }

    TimelineStore.update((timeline) => {
      timeline.setLeftMarker(value1)
      timeline.setCurrTime(value2)
      timeline.setRightMarker(value3)
      updateXPositions()
      return timeline
    })
  }

  const increaseSpeed = () => {
    ConfigStore.update((currentConfig) => {
      const currentIndex = SPEED_PRESETS.findIndex((s) => s >= currentConfig.animationRate)
      const nextIndex = Math.min(currentIndex + 1, SPEED_PRESETS.length - 1)
      return { ...currentConfig, animationRate: SPEED_PRESETS[nextIndex] }
    })
    if (p5Instance) p5Instance.loop()
  }

  const decreaseSpeed = () => {
    ConfigStore.update((currentConfig) => {
      const currentIndex = SPEED_PRESETS.findIndex((s) => s >= currentConfig.animationRate)
      const prevIndex = Math.max(currentIndex - 1, 0)
      return { ...currentConfig, animationRate: SPEED_PRESETS[prevIndex] }
    })
    if (p5Instance) p5Instance.loop()
  }

  onMount(async () => {
    if (typeof window !== 'undefined') {
      import('toolcool-range-slider').then(async () => {
        loaded = true
        await tick()

        const slider = document.querySelector('tc-range-slider')
        if (slider) {
          slider.addEventListener('change', (event: Event) => {
            handleChange(event as SliderChangeEvent)
          })
        }
        await tick()
        updateXPositions()
      })

      window.addEventListener('resize', updateXPositions)
    }
  })

  onDestroy(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('resize', updateXPositions)
  })
</script>

{#if loaded}
  <div class="flex flex-col w-11/12 h-full py-3">
    <div class="slider-container" bind:this={sliderContainer}>
      <!-- Progress fill: from left marker to current time -->
      <div class="progress-fill" style="left: {leftMarkerPercent}%; width: {fillWidth}%;"></div>

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
        pointer1-width="6px"
        pointer1-height="30px"
        pointer1-radius="0"
        pointer2-width="14px"
        pointer2-height="14px"
        pointer2-radius="50%"
        pointer3-width="6px"
        pointer3-height="30px"
        pointer3-radius="0"
        slider-height="4px"
        slider-radius="2px"
        slider-bg="#e2e8f0"
        slider-bg-fill="#94a3b8"
      ></tc-range-slider>
    </div>

    <div class="controls-row">
      <!-- Left: Playback controls -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1">
          <button
            onclick={toggleAnimation}
            class="play-pause-btn"
            aria-label={isAnimating ? 'Pause' : 'Play'}
          >
            {#if isAnimating}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                  clip-rule="evenodd"
                />
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}
          </button>

          <button class="reset-btn" onclick={resetToStart} title="Reset to start" aria-label="Reset">
            <MdRefresh />
          </button>
        </div>

        <div class="speed-controls">
          <button class="speed-adjust" onclick={decreaseSpeed} title="Slower" aria-label="Slower">
            −
          </button>
          <span class="speed-display">{speedLabel}</span>
          <button class="speed-adjust" onclick={increaseSpeed} title="Faster" aria-label="Faster">
            +
          </button>
        </div>
      </div>

      <!-- Center: Current time -->
      <button class="current-time" onclick={cycleTimeFormat} title="Click to change time format">
        {formattedCurr}
      </button>

      <!-- Right: Time range -->
      <button class="time-range" onclick={cycleTimeFormat} title="Click to change time format">
        <span class="font-mono text-sm text-gray-500">{formattedLeft} – {formattedRight}</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .controls-row {
    display: flex;
    width: 100%;
    margin-top: 0.5rem;
    padding-left: 0.5rem;
    align-items: center;
    justify-content: space-between;
  }

  .current-time {
    font-family: monospace;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    background: #f3f4f6;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .current-time:hover {
    background: #e5e7eb;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    transition:
      background-color 0.2s,
      color 0.2s;
    padding: 2px;
  }

  .reset-btn:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .reset-btn :global(svg) {
    width: 16px;
    height: 16px;
  }

  .time-range {
    border: none;
    background: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .time-range:hover {
    background: #f3f4f6;
  }

  .slider-container {
    position: relative;
  }

  .progress-fill {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    height: 6px;
    background-color: #3b82f6;
    border-radius: 3px;
    pointer-events: none;
    z-index: 1;
    transition: width 0.05s linear;
  }

  :host {
    width: 100% !important;
  }

  .play-pause-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background-color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .play-pause-btn:hover {
    background-color: #2563eb;
  }

  .play-pause-btn svg {
    width: 16px;
    height: 16px;
    color: #ffffff;
  }

  .speed-controls {
    display: flex;
    align-items: center;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .speed-adjust {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background-color: #ffffff;
    color: #6b7280;
    cursor: pointer;
    transition:
      background-color 0.15s,
      color 0.15s;
    font-size: 1rem;
    font-weight: 500;
  }

  .speed-adjust:hover {
    background-color: #f3f4f6;
    color: #374151;
  }

  .speed-display {
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    color: #374151;
    min-width: 2.5rem;
    text-align: center;
    border-left: 1px solid #e5e7eb;
    border-right: 1px solid #e5e7eb;
  }

  /* Slider pointer styles */
  :global(tc-range-slider) {
    --pointer-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Left and right boundary markers - blue */
  :global(tc-range-slider tc-range-slider-pointer:nth-child(1)),
  :global(tc-range-slider tc-range-slider-pointer:nth-child(3)) {
    background-color: #3b82f6 !important;
    box-shadow: var(--pointer-shadow);
  }

  :global(tc-range-slider tc-range-slider-pointer:nth-child(1):hover),
  :global(tc-range-slider tc-range-slider-pointer:nth-child(3):hover) {
    background-color: #2563eb !important;
  }

  /* Middle playhead - circular with triangle pointer */
  :global(tc-range-slider tc-range-slider-pointer:nth-child(2)) {
    background-color: #ef4444 !important;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
    z-index: 10;
    cursor: grab;
    border: 2px solid #fff;
  }

  /* Triangle pointer above the circle */
  :global(tc-range-slider tc-range-slider-pointer:nth-child(2))::before {
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

  :global(tc-range-slider tc-range-slider-pointer:nth-child(2):hover) {
    background-color: #dc2626 !important;
    transform: scale(1.1);
  }

  :global(tc-range-slider tc-range-slider-pointer:nth-child(2):active) {
    cursor: grabbing;
  }
</style>
