<script lang="ts">
  import CodeStore from '../../stores/codeStore'
  import ConfigStore from '../../stores/configStore'
  import { redrawCanvas } from '$lib/utils/p5'
  import { toggleColorMode } from '$lib/history/config-actions'
  import { setCodeEnabled, toggleAllCodes, setCodeColor } from '$lib/history/data-actions'

  const sortedCodes = $derived(
    [...$CodeStore].sort((a, b) => {
      if (a.code.toLowerCase() === 'no codes') return 1
      if (b.code.toLowerCase() === 'no codes') return -1
      return a.code.localeCompare(b.code)
    })
  )

  const allEnabled = $derived($CodeStore.every((code) => code.enabled))
</script>

<div class="flex flex-col gap-6 px-3 py-4">
  <section class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold uppercase tracking-wide opacity-60">Display</h3>
    <label class="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        checked={allEnabled}
        onchange={() => {
          toggleAllCodes()
          redrawCanvas()
        }}
      />
      Enable all
    </label>
    <label class="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        class="checkbox checkbox-sm"
        checked={$ConfigStore.isPathColorMode}
        onchange={() => {
          toggleColorMode()
          redrawCanvas()
        }}
      />
      Color paths by code
    </label>
  </section>

  <section class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold uppercase tracking-wide opacity-60">Codes</h3>
    <ul class="flex flex-col gap-1">
      {#each sortedCodes as code (code.code)}
        <li class="flex items-center gap-2 text-sm">
          <input
            type="color"
            class="color-swatch"
            value={code.color}
            aria-label="Color for {code.code}"
            onchange={(e) => {
              setCodeColor(code.code, e.currentTarget.value)
              redrawCanvas()
            }}
          />
          <label class="flex flex-1 min-w-0 items-center justify-between gap-2 cursor-pointer">
            <span class="truncate" class:opacity-50={!code.enabled}>{code.code}</span>
            <input
              type="checkbox"
              class="toggle toggle-sm toggle-primary"
              checked={code.enabled}
              onchange={(e) => {
                setCodeEnabled(code.code, e.currentTarget.checked)
                redrawCanvas()
              }}
            />
          </label>
        </li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .color-swatch {
    width: 1rem;
    height: 1rem;
    padding: 0;
    border: none;
    border-radius: 9999px;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
  }

  .color-swatch::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-swatch::-webkit-color-swatch {
    border: none;
    border-radius: 9999px;
  }

  .color-swatch::-moz-color-swatch {
    border: none;
    border-radius: 9999px;
  }
</style>
