<script lang="ts">
  import MdKeyboard from '~icons/mdi/keyboard'
  import MdCloudDownload from '~icons/mdi/cloud-download'
  import MdTableEye from '~icons/mdi/table-eye'
  import ConfigStore, { initialConfig } from '../../../stores/configStore.ts'
  import GPSStore from '../../../stores/gpsStore.ts'
  import { timelineV2Store } from '#lib/timeline/store.ts'
  import { redrawCanvas } from '#lib/utils/p5.ts'
  import MapStyleSelector from '#lib/components/MapStyleSelector.svelte'
  import { handleConfigChange } from '#lib/components/panels/config.ts'
  import { icon, toggleRow, rangeRow, panelSection } from '#lib/components/panels/PanelRows.svelte'
  import { workspace, downloadCodes, openCheatsheet } from '#lib/workspace/workspace.svelte.ts'

  const currentConfig = $derived($ConfigStore)
  let timelineEndTime = $state(timelineV2Store.getState().dataEnd)

  $effect(() => {
    const unsubscribe = timelineV2Store.subscribe((state) => {
      timelineEndTime = state.dataEnd
    })
    return unsubscribe
  })

  function resetSettings() {
    ConfigStore.update(() => ({ ...initialConfig }))
    redrawCanvas()
  }
</script>

<div class="flex flex-col gap-6 px-3 py-4">
  <ul class="menu w-full p-0">
    {@render toggleRow('Preserve aspect ratio', currentConfig.preserveFloorplanAspectRatio, () =>
      handleConfigChange(
        'preserveFloorplanAspectRatio',
        !currentConfig.preserveFloorplanAspectRatio
      )
    )}
  </ul>

  {#if $GPSStore.isGPSMode}
    {#snippet mapBody()}
      <MapStyleSelector />
    {/snippet}
    {@render panelSection('Map style', mapBody)}
  {/if}

  {#snippet drawingBody()}
    {@render rangeRow(
      `Animation rate: ${currentConfig.animationRate}`,
      'animationRate',
      0.01,
      1,
      0.01,
      currentConfig.animationRate,
      (e) => handleConfigChange('animationRate', parseFloat(e.currentTarget.value))
    )}
    {@render rangeRow(
      `Path simplification: ${currentConfig.pathSimplification}px`,
      'pathSimplification',
      0.5,
      8,
      0.5,
      currentConfig.pathSimplification,
      (e) => handleConfigChange('pathSimplification', parseFloat(e.currentTarget.value))
    )}
    {@render rangeRow(
      `Movement line weight: ${currentConfig.movementStrokeWeight}`,
      'movementStrokeWeight',
      1,
      20,
      1,
      currentConfig.movementStrokeWeight,
      (e) => handleConfigChange('movementStrokeWeight', parseInt(e.currentTarget.value))
    )}
    {@render rangeRow(
      `Stop line weight: ${currentConfig.stopStrokeWeight}`,
      'stopStrokeWeight',
      1,
      20,
      1,
      currentConfig.stopStrokeWeight,
      (e) => handleConfigChange('stopStrokeWeight', parseInt(e.currentTarget.value))
    )}
    <div class="flex flex-col gap-1">
      <label for="inputSeconds" class="text-xs">End time (seconds)</label>
      <input
        id="inputSeconds"
        type="text"
        inputmode="numeric"
        bind:value={timelineEndTime}
        oninput={(e) => {
          let value = parseInt(e.currentTarget.value.replace(/\D/g, '')) || 0
          timelineV2Store.initialize(value, 0)
        }}
        class="input input-bordered input-sm"
      />
    </div>
  {/snippet}
  {@render panelSection('Drawing', drawingBody)}

  {#snippet toolsBody()}
    <ul class="menu w-full p-0">
      <li>
        <button onclick={() => (workspace.dataExplorerOpen = true)} class="flex items-center gap-2">
          {@render icon(MdTableEye)}
          Data explorer
        </button>
      </li>
      <li>
        <button onclick={downloadCodes} class="flex items-center gap-2">
          {@render icon(MdCloudDownload)}
          Download codes
        </button>
      </li>
      <li>
        <button onclick={openCheatsheet} class="flex items-center gap-2">
          {@render icon(MdKeyboard)}
          Keyboard shortcuts
        </button>
      </li>
    </ul>
    <button class="btn btn-sm btn-warning self-start" onclick={resetSettings}>
      Reset settings
    </button>
  {/snippet}
  {@render panelSection('Tools', toolsBody)}
</div>
