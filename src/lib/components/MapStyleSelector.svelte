<script lang="ts">
  import MdMap from '~icons/mdi/map'
  import MdCheck from '~icons/mdi/check'
  import GPSStore, { setMapStyle } from '../../stores/gpsStore'
  import P5Store from '../../stores/p5Store'
  import { loadMapAsFloorPlan } from '$lib/gps/mapbox-service'
  import { MAP_STYLES, type MapboxStyle } from '$lib/gps/gps-types'
  import { clickOutsideClose } from '$lib/actions/clickOutside'

  let p5Instance = $state<any>(null)

  $effect(() => {
    p5Instance = $P5Store
  })

  async function handleStyleChange(style: MapboxStyle) {
    const gpsState = $GPSStore
    if (!gpsState.bounds || !p5Instance || gpsState.isLoading) return

    // Don't reload if same style
    if (gpsState.mapStyle === style) return

    setMapStyle(style)

    try {
      await loadMapAsFloorPlan(p5Instance, gpsState.bounds, style)
    } catch (error) {
      console.error('Failed to load map style:', error)
    }
  }
</script>

{#if $GPSStore.isGPSMode}
  <details class="dropdown" use:clickOutsideClose>
    <summary class="btn btn-sm ml-4 gap-1 flex items-center" class:loading={$GPSStore.isLoading}>
      <div class="w-4 h-4"><MdMap /></div>
      Map
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </summary>
    <ul class="menu dropdown-content rounded-box z-[1] w-44 p-2 shadow bg-base-100">
      {#each MAP_STYLES as style}
        {@const isSelected = $GPSStore.mapStyle === style.value}
        <li>
          <button
            onclick={() => handleStyleChange(style.value)}
            class="w-full text-left flex items-center"
            class:bg-primary={isSelected}
            class:text-primary-content={isSelected}
            disabled={$GPSStore.isLoading}
          >
            <div class="w-4 h-4 mr-2">
              {#if isSelected}
                <MdCheck />
              {/if}
            </div>
            {style.label}
          </button>
        </li>
      {/each}
    </ul>
  </details>
{/if}
