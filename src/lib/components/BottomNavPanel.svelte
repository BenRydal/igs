<script lang="ts">
  import FloatingDropdown from './FloatingDropdown.svelte'
  import ToggleMenuItem from './ToggleMenuItem.svelte'
  import ColorPicker from './ColorPicker.svelte'
  import TimelinePanel from './TimelinePanel.svelte'
  import ConfigStore from '../../stores/configStore'
  import CodeStore from '../../stores/codeStore'
  import UserStore from '../../stores/userStore'
  import P5Store from '../../stores/p5Store'
  import { Z_INDEX } from '$lib/styles/z-index'
  import type p5 from 'p5'

  // Reactive p5 instance
  let p5Instance = $state<p5 | null>(null)

  $effect(() => {
    p5Instance = $P5Store
  })

  // Sorted codes - "no codes" goes to the end
  let sortedCodes = $derived(
    [...$CodeStore].sort((a, b) => {
      if (a.code.toLowerCase() === 'no codes') return 1
      if (b.code.toLowerCase() === 'no codes') return -1
      return a.code.localeCompare(b.code)
    })
  )

  // Check if all codes are enabled
  let allCodesEnabled = $derived($CodeStore.every((code) => code.enabled))

  /**
   * Toggle enable state for all codes
   */
  function toggleSelectAllCodes() {
    const allEnabled = $CodeStore.every((code) => code.enabled)
    CodeStore.update((codes) => codes.map((code) => ({ ...code, enabled: !allEnabled })))
    p5Instance?.loop()
  }

  /**
   * Handle code enabled toggle
   */
  function handleCodeEnabledChange(
    codeEntry: { code: string; enabled: boolean; color: string },
    checked: boolean
  ) {
    CodeStore.update((codes) =>
      codes.map((c) => (c.code === codeEntry.code ? { ...c, enabled: checked } : c))
    )
    p5Instance?.loop()
  }

  /**
   * Handle code color change
   */
  function handleCodeColorChange(
    codeEntry: { code: string; enabled: boolean; color: string },
    newColor: string
  ) {
    CodeStore.update((codes) =>
      codes.map((c) => (c.code === codeEntry.code ? { ...c, color: newColor } : c))
    )
    p5Instance?.loop()
  }

  /**
   * Handle "Color by Codes" toggle
   */
  function handleColorByCodesChange(checked: boolean) {
    ConfigStore.update((config) => ({ ...config, isPathColorMode: checked }))
    p5Instance?.loop()
  }

  /**
   * Handle user movement toggle
   */
  function handleUserMovementChange(userName: string, checked: boolean) {
    UserStore.update((users) =>
      users.map((u) => (u.name === userName ? { ...u, enabled: checked } : u))
    )
    p5Instance?.loop()
  }

  /**
   * Handle user talk toggle
   */
  function handleUserTalkChange(userName: string, checked: boolean) {
    UserStore.update((users) =>
      users.map((u) => (u.name === userName ? { ...u, conversation_enabled: checked } : u))
    )
    p5Instance?.loop()
  }

  /**
   * Handle user color change
   */
  function handleUserColorChange(userName: string, newColor: string) {
    UserStore.update((users) =>
      users.map((u) => (u.name === userName ? { ...u, color: newColor } : u))
    )
    p5Instance?.loop()
  }

  /**
   * Handle horizontal scroll with mouse wheel
   */
  function handleWheel(e: WheelEvent) {
    if (e.deltaY !== 0) {
      e.preventDefault()
      e.currentTarget.scrollLeft += e.deltaY
    }
  }
</script>

<div
  class="btm-nav flex justify-between"
  style="position: fixed; bottom: 0; left: 0; right: 0; height: auto; min-height: 6rem; z-index: {Z_INDEX.BOTTOM_NAV}; padding: 0;"
>
  <!-- Left Side: User/Code Buttons -->
  <div
    class="flex flex-1 flex-row justify-start items-center bg-[#f6f5f3] px-8 overflow-x-auto"
    style="min-height: inherit; align-self: stretch;"
    onwheel={handleWheel}
  >
    <!-- Codes Dropdown -->
    {#if $ConfigStore.dataHasCodes}
      <div class="relative mr-2">
        <FloatingDropdown
          id="dropdown-codes"
          buttonText="CODES"
          buttonClass="btn"
          placement="top"
          offset={8}
        >
          <ul class="menu w-64 max-h-[75vh] overflow-y-auto flex-nowrap">
            <!-- Enable All Toggle -->
            <ToggleMenuItem
              label="Enable All"
              checked={allCodesEnabled}
              onChange={toggleSelectAllCodes}
              showCheckbox={true}
            />

            <!-- Color by Codes Toggle -->
            <ToggleMenuItem
              label="Color by Codes"
              checked={$ConfigStore.isPathColorMode}
              onChange={handleColorByCodesChange}
              showCheckbox={true}
            />

            <div class="divider"></div>

            <!-- Individual Code Controls -->
            {#each sortedCodes as code, index}
              <li><h3 class="pointer-events-none">{code.code.toUpperCase()}</h3></li>

              <!-- Code Enabled Toggle -->
              <ToggleMenuItem
                label="Enabled"
                checked={code.enabled}
                onChange={(checked) => handleCodeEnabledChange(code, checked)}
                showCheckbox={true}
              />

              <!-- Code Color Picker -->
              <li>
                <div class="flex items-center">
                  <ColorPicker
                    value={code.color}
                    onChange={(newColor) => handleCodeColorChange(code, newColor)}
                    label="Color"
                    size="sm"
                    showLabel={true}
                    class="flex items-center"
                  />
                </div>
              </li>

              {#if index !== sortedCodes.length - 1}
                <div class="divider"></div>
              {/if}
            {/each}
          </ul>
        </FloatingDropdown>
      </div>
    {/if}

    <!-- User Dropdowns -->
    {#each $UserStore as user}
      <div class="relative mr-2">
        <FloatingDropdown id="dropdown-user-{user.name}" placement="top" offset={8}>
          {#snippet buttonChildren()}
            <span style="color: {user.color};">{user.name}</span>
          {/snippet}

          <ul class="menu w-52">
            <!-- Movement Toggle -->
            <ToggleMenuItem
              label="Movement"
              checked={user.enabled}
              onChange={(checked) => handleUserMovementChange(user.name, checked)}
              showCheckbox={true}
            />

            <!-- Talk Toggle -->
            <ToggleMenuItem
              label="Talk"
              checked={user.conversation_enabled}
              onChange={(checked) => handleUserTalkChange(user.name, checked)}
              showCheckbox={true}
            />

            <!-- Color Picker -->
            <li class="py-2">
              <div class="flex items-center">
                <ColorPicker
                  value={user.color}
                  onChange={(newColor) => handleUserColorChange(user.name, newColor)}
                  label="Color"
                  size="sm"
                  showLabel={true}
                  class="flex items-center"
                />
              </div>
            </li>
          </ul>
        </FloatingDropdown>
      </div>
    {/each}
  </div>

  <!-- Right Side: Timeline -->
  <div
    class="flex-1 bg-[#f6f5f3] overflow-visible flex items-center justify-center py-1"
    style="min-height: inherit; align-self: stretch;"
  >
    <TimelinePanel />
  </div>
</div>

<style>
  /* Ensure horizontal scroll works smoothly */
  .overflow-x-auto::-webkit-scrollbar {
    height: 8px;
  }

  .overflow-x-auto::-webkit-scrollbar-track {
    background: #e5e7eb;
    border-radius: 4px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 4px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
</style>
