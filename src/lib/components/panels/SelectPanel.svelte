<script lang="ts">
  import ConfigStore from '../../../stores/configStore.ts'
  import { toggleSelection } from '#lib/components/panels/config.ts'
  import { toggleRow, rangeRow, panelSection } from '#lib/components/panels/PanelRows.svelte'
  import { setSelectorSize, setSlicerSize } from '#lib/history/config-actions.ts'
  import { capitalizeFirstLetter } from '#lib/utils/string.ts'

  const selectToggleOptions = ['circleToggle', 'sliceToggle', 'highlightToggle'] as const
  const currentConfig = $derived($ConfigStore)
</script>

<div class="flex flex-col gap-6 px-3 py-4">
  {#snippet modeBody()}
    <ul class="menu w-full p-0">
      {#each selectToggleOptions as toggle (toggle)}
        {@render toggleRow(
          capitalizeFirstLetter(toggle.replace('Toggle', '')),
          $ConfigStore[toggle],
          () => toggleSelection(toggle, selectToggleOptions)
        )}
      {/each}
    </ul>
  {/snippet}
  {@render panelSection('Mode', modeBody)}

  {#snippet sizeBody()}
    {@render rangeRow(
      `Circle size: ${currentConfig.selectorSize}px`,
      'selectorSizeRange',
      20,
      300,
      10,
      currentConfig.selectorSize,
      (e) => setSelectorSize(parseFloat(e.currentTarget.value))
    )}
    {@render rangeRow(
      `Slicer width: ${currentConfig.slicerSize}px`,
      'slicerSizeRange',
      5,
      100,
      5,
      currentConfig.slicerSize,
      (e) => setSlicerSize(parseFloat(e.currentTarget.value))
    )}
  {/snippet}
  {@render panelSection('Size', sizeBody)}
</div>
