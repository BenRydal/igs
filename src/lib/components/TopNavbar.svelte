<script lang="ts">
  import MdRotateLeft from '~icons/mdi/rotate-left'
  import MdRotateRight from '~icons/mdi/rotate-right'
  import Md3DRotation from '~icons/mdi/rotate-3d-variant'
  import MdVideocam from '~icons/mdi/video'
  import MdVideocamOff from '~icons/mdi/video-off'
  import MdCloudDownload from '~icons/mdi/cloud-download'
  import MdCloudUpload from '~icons/mdi/cloud-upload'
  import MdHelpOutline from '~icons/mdi/help-circle-outline'
  import MdSettings from '~icons/mdi/cog'
  import FloatingDropdown from '$lib/components/FloatingDropdown.svelte'
  import ToggleMenuItem from '$lib/components/ToggleMenuItem.svelte'
  import RangeSlider from '$lib/components/RangeSlider.svelte'
  import IconButton from '$lib/components/IconButton.svelte'
  import { clickOutside } from '$lib/actions/clickOutside'
  import { capitalizeFirstLetter } from '$lib/utils/string'
  import ConfigStore from '../../stores/configStore'
  import {
    toggleMovement,
    toggleStops,
    toggleCircle,
    toggleSlice,
    toggleHighlight,
    toggleAlign,
    setStopSliderValue,
    setConversationRectWidth,
    setWordToSearch,
    setSelectorSize,
    setSlicerSize,
  } from '$lib/history/config-actions'

  interface Props {
    onOpenSettings: () => void
    onOpenHelp: () => void
    onFileUpload: (event: Event) => void
    onExampleSelect: (value: string) => void
    onClearAll: () => void
    onClearMovement: () => void
    onClearConversation: () => void
    onClearCodes: () => void
    onClearVideo: () => void
    onRotateLeft: () => void
    onRotateRight: () => void
    onToggle3D: () => void
    onToggleVideo: () => void
    onDownloadCodeFile: () => void
    isVideoShowing?: boolean
  }

  let {
    onOpenSettings,
    onOpenHelp,
    onFileUpload,
    onExampleSelect,
    onClearAll,
    onClearMovement,
    onClearConversation,
    onClearCodes,
    onClearVideo,
    onRotateLeft,
    onRotateRight,
    onToggle3D,
    onToggleVideo,
    onDownloadCodeFile,
    isVideoShowing = false,
  }: Props = $props()

  // Filter options
  const filterToggleOptions = ['movementToggle', 'stopsToggle'] as const

  // Select options (mutually exclusive)
  const selectToggleOptions = ['circleToggle', 'sliceToggle', 'highlightToggle'] as const

  // Talk options
  const conversationToggleOptions = ['alignToggle'] as const

  // Example dropdown data
  const dropdownOptions = [
    { label: 'Sports', items: [{ value: 'example-1', label: "Michael Jordan's Last Shot" }] },
    { label: 'Museums', items: [{ value: 'example-2', label: 'Family Gallery Visit' }] },
    {
      label: 'Classrooms',
      items: [
        { value: 'example-11', label: 'Sandy Lesson 1' },
        { value: 'example-12', label: 'Sandy Lesson 2' },
        { value: 'example-10', label: 'AP Math Lesson' },
        { value: 'example-4', label: '3rd Grade Sean Numbers Discussion' },
      ],
    },
    {
      label: 'TIMSS 1999 Video Study',
      items: [
        { value: 'example-3', label: 'U.S. Science Lesson (weather)' },
        { value: 'example-5', label: 'Czech Republic Science Lesson (density)' },
        { value: 'example-6', label: 'Japan Math Lesson (angles)' },
        { value: 'example-7', label: 'U.S. Math Lesson (linear equations)' },
        { value: 'example-8', label: 'U.S. Science Lesson (rocks)' },
        { value: 'example-9', label: 'Netherlands Math Lesson (pythagorean theorem)' },
      ],
    },
  ]

  // State
  let showExampleDropdown = $state(false)
  let selectedExample = $state('')
  let wordSearchValue = $state('')
  let files = $state<FileList | null>(null)

  // Derived state from ConfigStore
  let currentConfig = $state($ConfigStore)

  $effect(() => {
    currentConfig = $ConfigStore
  })

  // Computed values
  let formattedStopLength = $derived(currentConfig.stopSliderValue.toFixed(0))

  // Toggle handlers (with undo support)
  function handleFilterToggle(toggle: string, _checked: boolean) {
    if (toggle === 'movementToggle') {
      toggleMovement()
    } else if (toggle === 'stopsToggle') {
      toggleStops()
    }
  }

  function handleSelectToggle(toggle: string, _checked: boolean) {
    // For mutually exclusive toggles, we toggle the clicked one
    // The history system will record this as an undoable action
    if (toggle === 'circleToggle') {
      toggleCircle()
      // Turn off the others if this one is being enabled
      if (!currentConfig.circleToggle) {
        if (currentConfig.sliceToggle) toggleSlice()
        if (currentConfig.highlightToggle) toggleHighlight()
      }
    } else if (toggle === 'sliceToggle') {
      toggleSlice()
      if (!currentConfig.sliceToggle) {
        if (currentConfig.circleToggle) toggleCircle()
        if (currentConfig.highlightToggle) toggleHighlight()
      }
    } else if (toggle === 'highlightToggle') {
      toggleHighlight()
      if (!currentConfig.highlightToggle) {
        if (currentConfig.circleToggle) toggleCircle()
        if (currentConfig.sliceToggle) toggleSlice()
      }
    }
  }

  function handleConversationToggle(toggle: string, _checked: boolean) {
    if (toggle === 'alignToggle') {
      toggleAlign()
    }
  }

  // Range slider handlers (with undo support)
  function handleStopLengthChange(value: number) {
    setStopSliderValue(value)
  }

  function handleRectWidthChange(value: number) {
    setConversationRectWidth(value)
  }

  function handleSelectorSizeChange(value: number) {
    setSelectorSize(value)
  }

  function handleSlicerSizeChange(value: number) {
    setSlicerSize(value)
  }

  // Word search handler (with undo support)
  function handleWordSearchInput(event: Event) {
    const target = event.target as HTMLInputElement
    const newWord = target.value.trim()
    wordSearchValue = newWord
    setWordToSearch(newWord)
  }

  // Example dropdown handlers
  function handleExampleSelect(value: string, label: string) {
    selectedExample = label
    showExampleDropdown = false
    onExampleSelect(value)
  }

  function handleClickOutsideExample() {
    showExampleDropdown = false
  }

  // File input change handler
  function handleFileChange(event: Event) {
    onFileUpload(event)
  }
</script>

<div class="navbar min-h-16 bg-[#ffffff]">
  <div class="flex-1 px-2 lg:flex-none">
    <a class="text-2xl font-bold text-black italic" href="https://interactiongeography.org">IGS</a>
  </div>

  <div class="flex items-center justify-end flex-1 px-2">
    <!-- Filter Dropdown -->
    <FloatingDropdown id="filter-dropdown" buttonText="Filter" buttonClass="btn btn-sm ml-4">
      <ul>
        {#each filterToggleOptions as toggle}
          <ToggleMenuItem
            label={capitalizeFirstLetter(toggle.replace('Toggle', ''))}
            bind:checked={currentConfig[toggle]}
            onChange={(checked) => handleFilterToggle(toggle, checked)}
          />
        {/each}
        <li class="px-4 py-2">
          <RangeSlider
            id="stop-length-slider"
            label="Stop Length"
            bind:value={currentConfig.stopSliderValue}
            min={1}
            max={currentConfig.maxStopLength}
            step={1}
            unit="sec"
            showValue={true}
            onChange={handleStopLengthChange}
          />
        </li>
      </ul>
    </FloatingDropdown>

    <!-- Select Dropdown -->
    <FloatingDropdown id="select-dropdown" buttonText="Select" buttonClass="btn btn-sm ml-4">
      <ul>
        {#each selectToggleOptions as toggle}
          <ToggleMenuItem
            label={capitalizeFirstLetter(toggle.replace('Toggle', ''))}
            bind:checked={currentConfig[toggle]}
            onChange={(checked) => handleSelectToggle(toggle, checked)}
          />
        {/each}
        <li class="divider my-1"></li>
        <li class="px-4 py-2">
          <label class="block text-sm font-medium mb-1">
            Circle Size: {currentConfig.selectorSize}px
          </label>
          <input
            type="range"
            min="20"
            max="300"
            step="10"
            bind:value={currentConfig.selectorSize}
            oninput={(e) => handleSelectorSizeChange(Number((e.target as HTMLInputElement).value))}
            class="range range-sm w-full"
          />
        </li>
        <li class="px-4 py-2">
          <label class="block text-sm font-medium mb-1">
            Slicer Width: {currentConfig.slicerSize}px
          </label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            bind:value={currentConfig.slicerSize}
            oninput={(e) => handleSlicerSizeChange(Number((e.target as HTMLInputElement).value))}
            class="range range-sm w-full"
          />
        </li>
      </ul>
    </FloatingDropdown>

    <!-- Talk Dropdown -->
    <FloatingDropdown id="talk-dropdown" buttonText="Talk" buttonClass="btn btn-sm ml-4">
      <ul>
        {#each conversationToggleOptions as toggle}
          <ToggleMenuItem
            label={capitalizeFirstLetter(toggle.replace('Toggle', ''))}
            bind:checked={currentConfig[toggle]}
            onChange={(checked) => handleConversationToggle(toggle, checked)}
          />
        {/each}
        <li class="px-4 py-2">
          <RangeSlider
            id="rect-width-slider"
            label="Rect Width"
            bind:value={currentConfig.conversationRectWidth}
            min={1}
            max={30}
            step={1}
            unit="px"
            showValue={true}
            onChange={handleRectWidthChange}
          />
        </li>
        <li class="px-4 py-2">
          <input
            type="text"
            placeholder="Search conversations..."
            value={wordSearchValue}
            oninput={handleWordSearchInput}
            class="input input-bordered input-sm w-full"
          />
        </li>
      </ul>
    </FloatingDropdown>

    <!-- Clear Dropdown -->
    <FloatingDropdown id="clear-dropdown" buttonText="Clear" buttonClass="btn btn-sm ml-4">
      <ul>
        <li>
          <button onclick={onClearMovement} class="w-full text-left px-4 py-2 hover:bg-base-200"
            >Movement</button
          >
        </li>
        <li>
          <button onclick={onClearConversation} class="w-full text-left px-4 py-2 hover:bg-base-200"
            >Conversation</button
          >
        </li>
        <li>
          <button onclick={onClearCodes} class="w-full text-left px-4 py-2 hover:bg-base-200"
            >Codes</button
          >
        </li>
        <li>
          <button onclick={onClearVideo} class="w-full text-left px-4 py-2 hover:bg-base-200"
            >Video</button
          >
        </li>
        <li class="divider my-1"></li>
        <li>
          <button
            onclick={onClearAll}
            class="w-full text-left px-4 py-2 hover:bg-base-200 text-error">All Data</button
          >
        </li>
      </ul>
    </FloatingDropdown>

    <!-- Icon Buttons -->
    <div class="flex items-center gap-1">
      <IconButton
        id="btn-rotate-left"
        icon={MdRotateLeft}
        tooltip="Rotate Left"
        onclick={onRotateLeft}
      />
      <IconButton
        id="btn-rotate-right"
        icon={MdRotateRight}
        tooltip="Rotate Right"
        onclick={onRotateRight}
      />
      <IconButton
        id="btn-toggle-3d"
        icon={Md3DRotation}
        tooltip="Toggle 2D/3D"
        onclick={onToggle3D}
      />

      {#if isVideoShowing}
        <IconButton
          id="btn-toggle-video"
          icon={MdVideocam}
          tooltip="Show/Hide Video"
          onclick={onToggleVideo}
        />
      {:else}
        <IconButton
          id="btn-toggle-video"
          icon={MdVideocamOff}
          tooltip="Show/Hide Video"
          onclick={onToggleVideo}
        />
      {/if}

      <IconButton
        icon={MdCloudDownload}
        tooltip="Download Code File"
        onclick={onDownloadCodeFile}
      />

      <!-- Upload Button -->
      <div class="tooltip tooltip-bottom" data-tip="Upload">
        <label for="file-input" class="btn btn-square btn-ghost w-11 h-11 min-h-11 cursor-pointer">
          <MdCloudUpload class="w-6 h-6" />
        </label>
      </div>
      <input
        class="hidden"
        id="file-input"
        multiple
        accept=".png, .jpg, .jpeg, .csv, .mp4"
        type="file"
        bind:files
        onchange={handleFileChange}
      />

      <IconButton icon={MdHelpOutline} tooltip="Help" onclick={onOpenHelp} />
      <IconButton icon={MdSettings} tooltip="Settings" onclick={onOpenSettings} />

      <!-- Example Dropdown -->
      <div class="relative inline-block text-left">
        <button
          onclick={() => (showExampleDropdown = !showExampleDropdown)}
          class="flex justify-between w-full rounded border border-gray-300 p-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-indigo-500"
          type="button"
        >
          {selectedExample || '-- Select an Example --'}
          <div
            class={`ml-2 transition-transform duration-300 ${showExampleDropdown ? 'rotate-0' : 'rotate-180'}`}
          >
            <span class="block w-3 h-3 border-l border-t border-gray-700 transform rotate-45"
            ></span>
          </div>
        </button>

        {#if showExampleDropdown}
          <div
            class="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg max-h-[75vh] overflow-y-auto"
            use:clickOutside={{
              onClickOutside: handleClickOutsideExample,
              enabled: showExampleDropdown,
            }}
          >
            <ul class="py-1" role="menu" aria-orientation="vertical">
              {#each dropdownOptions as group}
                <li class="px-4 py-2 font-semibold text-gray-600">{group.label}</li>
                {#each group.items as item}
                  <li>
                    <button
                      onclick={() => handleExampleSelect(item.value, item.label)}
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      type="button"
                    >
                      {item.label}
                    </button>
                  </li>
                {/each}
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Additional custom styles if needed */
</style>
