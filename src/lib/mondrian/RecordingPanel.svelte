<script lang="ts">
  import VideoStore from '../../stores/videoStore'
  import { ensureTimelineCovers, mondrianSettings } from './session'

  const captureIntervals = [
    { value: 0.004, label: 'As fast as possible' },
    { value: 0.1, label: 'Every 0.1 s' },
    { value: 0.25, label: 'Every 0.25 s' },
    { value: 0.5, label: 'Every 0.5 s' },
    { value: 1, label: 'Every 1 s' },
  ]
  const heartbeatIntervals = [0.25, 0.5, 1, 2]

  const minutes = $derived(Math.floor($mondrianSettings.speculateDuration / 60))
  const seconds = $derived($mondrianSettings.speculateDuration % 60)

  function setDuration(mins: number, secs: number) {
    const total = Math.max(1, Math.round(mins) * 60 + Math.round(secs))
    mondrianSettings.update((s) => ({ ...s, speculateDuration: total }))
    ensureTimelineCovers(total)
  }
</script>

<div class="flex flex-col gap-6 px-3 py-4">
  <section class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold uppercase tracking-wide opacity-60">Point capture</h3>
    <div class="flex flex-col gap-1">
      <label for="capture-interval" class="text-xs">While moving</label>
      <select
        id="capture-interval"
        class="select select-sm w-full"
        value={$mondrianSettings.activeInterval}
        onchange={(e) =>
          mondrianSettings.update((s) => ({
            ...s,
            activeInterval: parseFloat(e.currentTarget.value),
          }))}
      >
        {#each captureIntervals as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <label class="flex items-center justify-between gap-2 text-sm cursor-pointer">
      <span>Record less often when still</span>
      <input
        type="checkbox"
        class="toggle toggle-sm toggle-primary"
        checked={$mondrianSettings.adaptive}
        onchange={(e) =>
          mondrianSettings.update((s) => ({ ...s, adaptive: e.currentTarget.checked }))}
      />
    </label>

    {#if $mondrianSettings.adaptive}
      <div class="flex flex-col gap-1">
        <label for="heartbeat-interval" class="text-xs">While still</label>
        <select
          id="heartbeat-interval"
          class="select select-sm w-full"
          value={$mondrianSettings.heartbeatInterval}
          onchange={(e) =>
            mondrianSettings.update((s) => ({
              ...s,
              heartbeatInterval: parseFloat(e.currentTarget.value),
            }))}
        >
          {#each heartbeatIntervals as value (value)}
            <option {value}>Every {value} s</option>
          {/each}
        </select>
      </div>
    {/if}
    <p class="text-xs opacity-70">Changes apply from the next recording.</p>
  </section>

  {#if !$VideoStore.isLoaded}
    <section class="flex flex-col gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wide opacity-60">
        Drawing without video
      </h3>
      <p class="text-xs opacity-70">
        The timeline plays on its own while you draw. Set how long it runs.
      </p>
      <div class="flex items-center gap-2">
        <input
          type="number"
          min="0"
          class="input input-sm w-20"
          aria-label="Minutes"
          value={minutes}
          onchange={(e) => setDuration(e.currentTarget.valueAsNumber || 0, seconds)}
        />
        <span class="text-sm">min</span>
        <input
          type="number"
          min="0"
          max="59"
          class="input input-sm w-20"
          aria-label="Seconds"
          value={seconds}
          onchange={(e) => setDuration(minutes, e.currentTarget.valueAsNumber || 0)}
        />
        <span class="text-sm">s</span>
      </div>
    </section>
  {/if}
</div>
