<script lang="ts">
  import ConfigStore from '../../../stores/configStore.ts'
  import {
    handleConfigChange,
    handleConfigChangeFromInput,
    toggleSelection,
  } from '#lib/components/panels/config.ts'
  import { toggleRow, rangeRow, panelSection } from '#lib/components/panels/PanelRows.svelte'

  const conversationToggleOptions = ['alignToggle'] as const
</script>

<div class="flex flex-col gap-6 px-3 py-4">
  {#snippet displayBody()}
    <ul class="menu w-full p-0">
      {@render toggleRow('Show speech bubbles', $ConfigStore.showConversationRects, () =>
        handleConfigChange('showConversationRects', !$ConfigStore.showConversationRects)
      )}
      {@render toggleRow('Align to side', $ConfigStore.alignToggle, () =>
        toggleSelection('alignToggle', conversationToggleOptions)
      )}
    </ul>
  {/snippet}
  {@render panelSection('Display', displayBody)}

  {#snippet groupedBody()}
    <ul class="menu w-full p-0">
      {@render toggleRow('Combine speakers', $ConfigStore.showSpeakerStripes, () =>
        handleConfigChange('showSpeakerStripes', !$ConfigStore.showSpeakerStripes)
      )}
    </ul>
    {@render rangeRow(
      `Group within ${$ConfigStore.clusterTimeThreshold} seconds`,
      'clusterTimeRange',
      1,
      60,
      1,
      $ConfigStore.clusterTimeThreshold,
      (e) => handleConfigChangeFromInput(e, 'clusterTimeThreshold')
    )}
    {@render rangeRow(
      `Group within ${$ConfigStore.clusterSpaceThreshold}px distance`,
      'clusterSpaceRange',
      0,
      200,
      1,
      $ConfigStore.clusterSpaceThreshold,
      (e) => handleConfigChangeFromInput(e, 'clusterSpaceThreshold')
    )}
  {/snippet}
  {@render panelSection('Grouped turns', groupedBody)}

  {#snippet individualBody()}
    {@render rangeRow(
      `Turn width: ${$ConfigStore.conversationRectWidth}px`,
      'rectWidthRange',
      1,
      30,
      1,
      $ConfigStore.conversationRectWidth,
      (e) => handleConfigChangeFromInput(e, 'conversationRectWidth')
    )}
  {/snippet}
  {@render panelSection('Individual turns', individualBody)}
</div>
