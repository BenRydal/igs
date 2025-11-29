<script lang="ts">
  import { tick } from 'svelte'
  import RangeSlider from '../RangeSlider.svelte'
  import { updateConfig } from '$lib/utils/config'
  import ConfigStore, { initialConfig } from '$stores/configStore'
  import TimelineStore from '$stores/timelineStore'
  import P5Store from '$stores/p5Store'
  import MdPlayCircle from '~icons/mdi/play-circle'
  import MdPalette from '~icons/mdi/palette'
  import MdDatabase from '~icons/mdi/database'
  import MdCog from '~icons/mdi/cog'

  interface Props {
    activeTab?: 'playback' | 'appearance' | 'data' | 'advanced'
    onResetTab?: (tab: string) => void
    onResetAll?: () => void
  }

  let { activeTab = $bindable('playback'), onResetTab, onResetAll }: Props = $props()

  // Subscribe to stores
  let currentConfig = $state($ConfigStore)
  let timeline = $state($TimelineStore)
  let p5Instance = $state($P5Store)

  // Keep stores in sync
  $effect(() => {
    currentConfig = $ConfigStore
  })

  $effect(() => {
    timeline = $TimelineStore
  })

  $effect(() => {
    p5Instance = $P5Store
  })

  // Define setting groups per tab
  const settingGroups = {
    playback: ['animationRate', 'endTime'],
    appearance: ['movementStrokeWeight', 'stopStrokeWeight', 'conversationRectWidth'],
    data: ['samplingInterval', 'stopSliderValue'],
    advanced: ['smallDataThreshold'],
  }

  // Tab configuration with icons
  const tabs = [
    { id: 'playback', label: 'Playback', icon: MdPlayCircle },
    { id: 'appearance', label: 'Appearance', icon: MdPalette },
    { id: 'data', label: 'Data', icon: MdDatabase },
    { id: 'advanced', label: 'Advanced', icon: MdCog },
  ] as const

  // Handle tab selection
  function selectTab(tabId: typeof activeTab) {
    activeTab = tabId
  }

  // Handle keyboard navigation
  function handleTabKeydown(event: KeyboardEvent, currentIndex: number) {
    let newIndex = currentIndex

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        break
      case 'ArrowRight':
        event.preventDefault()
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = tabs.length - 1
        break
      default:
        return
    }

    activeTab = tabs[newIndex].id as typeof activeTab
    // Focus the new tab
    const tabButton = document.querySelector(`[data-tab-index="${newIndex}"]`) as HTMLButtonElement
    tabButton?.focus()
  }

  // Reset current tab to defaults
  function resetCurrentTab() {
    const settings = settingGroups[activeTab]

    ConfigStore.update((config) => {
      const updated = { ...config }
      settings.forEach((setting) => {
        if (setting === 'endTime') {
          // Handle timeline separately
          return
        }
        if (setting in initialConfig) {
          updated[setting as keyof typeof config] =
            initialConfig[setting as keyof typeof initialConfig]
        }
      })
      return updated
    })

    // Reset endTime if in playback tab
    if (activeTab === 'playback') {
      TimelineStore.update((tl) => {
        tl.setCurrTime(0)
        tl.setStartTime(0)
        tl.setEndTime(initialConfig.samplingInterval * 100) // Default end time
        tl.setLeftMarker(0)
        tl.setRightMarker(initialConfig.samplingInterval * 100)
        return tl
      })
    }

    if (p5Instance) {
      p5Instance.loop()
    }

    onResetTab?.(activeTab)
  }

  // Reset all settings
  function resetAll() {
    ConfigStore.update(() => ({ ...initialConfig }))

    TimelineStore.update((tl) => {
      tl.setCurrTime(0)
      tl.setStartTime(0)
      tl.setEndTime(initialConfig.samplingInterval * 100)
      tl.setLeftMarker(0)
      tl.setRightMarker(initialConfig.samplingInterval * 100)
      return tl
    })

    if (p5Instance) {
      p5Instance.loop()
    }

    onResetAll?.()
  }

  // Handle end time input change
  function handleEndTimeChange(event: Event) {
    const target = event.target as HTMLInputElement
    let value = parseInt(target.value.replace(/\D/g, '')) || 0

    TimelineStore.update((tl) => {
      tl.setCurrTime(0)
      tl.setStartTime(0)
      tl.setEndTime(value)
      tl.setLeftMarker(0)
      tl.setRightMarker(value)
      return tl
    })
  }
</script>

<div class="settings-tabs">
  <!-- Tab Bar -->
  <div role="tablist" class="tabs tabs-boxed mb-6 bg-base-200">
    {#each tabs as tab, index}
      {@const isActive = activeTab === tab.id}
      <button
        role="tab"
        type="button"
        class="tab gap-2 transition-all duration-200"
        class:tab-active={isActive}
        aria-selected={isActive}
        aria-controls="{tab.id}-panel"
        tabindex={isActive ? 0 : -1}
        data-tab-index={index}
        onclick={() => selectTab(tab.id as typeof activeTab)}
        onkeydown={(e) => handleTabKeydown(e, index)}
      >
        <svelte:component this={tab.icon} class="w-4 h-4" />
        <span class="hidden sm:inline">{tab.label}</span>
      </button>
    {/each}
  </div>

  <!-- Tab Panels -->
  <div class="tab-content">
    <!-- Playback Tab -->
    {#if activeTab === 'playback'}
      <div
        role="tabpanel"
        id="playback-panel"
        class="tab-panel fade-in"
        aria-labelledby="playback-tab"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Playback Settings</h3>
          <button
            class="btn btn-sm btn-ghost"
            onclick={resetCurrentTab}
            aria-label="Reset playback settings">Reset</button
          >
        </div>

        <div class="flex flex-col space-y-4">
          <RangeSlider
            id="animationRate"
            label="Animation Rate"
            value={currentConfig.animationRate}
            min={0.01}
            max={1}
            step={0.01}
            onChange={(value) => updateConfig('animationRate', value)}
          />

          <div class="flex flex-col">
            <label for="inputSeconds" class="text-sm font-medium text-base-content mb-2">
              End Time (seconds)
            </label>
            <input
              id="inputSeconds"
              type="text"
              value={timeline.endTime}
              oninput={handleEndTimeChange}
              class="input input-bordered"
              aria-label="End time in seconds"
              inputmode="numeric"
              pattern="[0-9]*"
            />
          </div>
        </div>
      </div>
    {/if}

    <!-- Appearance Tab -->
    {#if activeTab === 'appearance'}
      <div
        role="tabpanel"
        id="appearance-panel"
        class="tab-panel fade-in"
        aria-labelledby="appearance-tab"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Appearance Settings</h3>
          <button
            class="btn btn-sm btn-ghost"
            onclick={resetCurrentTab}
            aria-label="Reset appearance settings">Reset</button
          >
        </div>

        <div class="flex flex-col space-y-4">
          <RangeSlider
            id="movementStrokeWeight"
            label="Movement Line Weight"
            value={currentConfig.movementStrokeWeight}
            min={1}
            max={20}
            step={1}
            onChange={(value) => updateConfig('movementStrokeWeight', value)}
          />

          <RangeSlider
            id="stopStrokeWeight"
            label="Stop Line Weight"
            value={currentConfig.stopStrokeWeight}
            min={1}
            max={20}
            step={1}
            onChange={(value) => updateConfig('stopStrokeWeight', value)}
          />

          <RangeSlider
            id="conversationRectWidth"
            label="Conversation Rect Width"
            value={currentConfig.conversationRectWidth}
            min={1}
            max={20}
            step={1}
            onChange={(value) => updateConfig('conversationRectWidth', value)}
          />
        </div>
      </div>
    {/if}

    <!-- Data Tab -->
    {#if activeTab === 'data'}
      <div role="tabpanel" id="data-panel" class="tab-panel fade-in" aria-labelledby="data-tab">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Data Settings</h3>
          <button
            class="btn btn-sm btn-ghost"
            onclick={resetCurrentTab}
            aria-label="Reset data settings">Reset</button
          >
        </div>

        <div class="flex flex-col space-y-4">
          <RangeSlider
            id="samplingInterval"
            label="Sampling Interval"
            value={currentConfig.samplingInterval}
            min={0.1}
            max={5}
            step={0.1}
            unit="sec"
            onChange={(value) => updateConfig('samplingInterval', value)}
          />

          <RangeSlider
            id="stopSliderValue"
            label="Stop Length"
            value={currentConfig.stopSliderValue}
            min={0}
            max={10}
            step={0.1}
            unit="sec"
            onChange={(value) => updateConfig('stopSliderValue', value)}
          />
        </div>
      </div>
    {/if}

    <!-- Advanced Tab -->
    {#if activeTab === 'advanced'}
      <div
        role="tabpanel"
        id="advanced-panel"
        class="tab-panel fade-in"
        aria-labelledby="advanced-tab"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Advanced Settings</h3>
          <button
            class="btn btn-sm btn-ghost"
            onclick={resetCurrentTab}
            aria-label="Reset advanced settings">Reset</button
          >
        </div>

        <div class="flex flex-col space-y-4">
          <RangeSlider
            id="smallDataThreshold"
            label="Small Data Threshold"
            value={currentConfig.smallDataThreshold}
            min={500}
            max={10000}
            step={100}
            onChange={(value) => updateConfig('smallDataThreshold', value)}
          />
        </div>
      </div>
    {/if}
  </div>

  <!-- Reset All Button -->
  <div class="mt-6 pt-4 border-t border-base-300">
    <button
      class="btn btn-warning btn-block"
      onclick={resetAll}
      aria-label="Reset all settings to defaults">Reset All Settings</button
    >
  </div>
</div>

<style>
  .settings-tabs {
    width: 100%;
  }

  .tabs {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .tab {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .tab-active {
    background-color: hsl(var(--p));
    color: hsl(var(--pc));
    font-weight: 600;
    position: relative;
  }

  .tab-active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: hsl(var(--pc));
  }

  .tab:not(.tab-active):hover {
    background-color: hsl(var(--b3));
  }

  .tab:focus-visible {
    outline: 2px solid hsl(var(--p));
    outline-offset: 2px;
    z-index: 1;
  }

  .tab-content {
    min-height: 300px;
  }

  .tab-panel {
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in {
    animation: fadeIn 0.2s ease-in-out;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .tab {
      padding: 0.5rem;
    }
  }
</style>
