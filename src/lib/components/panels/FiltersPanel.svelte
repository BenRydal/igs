<script lang="ts">
  import ConfigStore from '../../../stores/configStore.ts'
  import { handleConfigChangeFromInput, toggleSelection } from '#lib/components/panels/config.ts'
  import { toggleRow, rangeRow, panelSection } from '#lib/components/panels/PanelRows.svelte'
  import { capitalizeFirstLetter } from '#lib/utils/string.ts'

  const filterToggleOptions = ['movementToggle', 'stopsToggle'] as const
  let formattedStopLength = $derived($ConfigStore.stopSliderValue.toFixed(0))
</script>

<div class="flex flex-col gap-6 px-3 py-4">
  {#snippet movementBody()}
    <ul class="menu w-full p-0">
      {#each filterToggleOptions as toggle (toggle)}
        {@render toggleRow(
          capitalizeFirstLetter(toggle.replace('Toggle', '')),
          $ConfigStore[toggle],
          () => toggleSelection(toggle, filterToggleOptions)
        )}
      {/each}
    </ul>
    {@render rangeRow(
      `Stop length: ${formattedStopLength} sec`,
      'stopLengthRange',
      1,
      $ConfigStore.maxStopLength,
      1,
      $ConfigStore.stopSliderValue,
      (e) => handleConfigChangeFromInput(e, 'stopSliderValue')
    )}
  {/snippet}
  {@render panelSection('Movement', movementBody)}
</div>
