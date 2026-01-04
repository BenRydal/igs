<script lang="ts">
  import P5, { type Sketch } from 'p5-svelte'

  import type p5 from 'p5'
  import MdHelpOutline from '~icons/mdi/help-circle-outline'
  import MdKeyboard from '~icons/mdi/keyboard'
  import MdCloudDownload from '~icons/mdi/cloud-download'
  import MdRotateLeft from '~icons/mdi/rotate-left'
  import MdRotateRight from '~icons/mdi/rotate-right'
  import MdAspectRatio from '~icons/mdi/aspect-ratio'
  import MdFitToPageOutline from '~icons/mdi/fit-to-page-outline'
  import Md3DRotation from '~icons/mdi/rotate-3d-variant'
  import MdVideocam from '~icons/mdi/video'
  import MdVideocamOff from '~icons/mdi/video-off'
  import MdCheck from '~icons/mdi/check'
  import MdSettings from '~icons/mdi/cog'
  import MdFileUploadOutline from '~icons/mdi/file-upload-outline'
  import MdVisibility from '~icons/mdi/eye'
  import MdVisibilityOff from '~icons/mdi/eye-off'
  import MdFilterList from '~icons/mdi/filter-variant'
  import MdSelectAll from '~icons/mdi/selection'
  import MdChat from '~icons/mdi/chat'
  import MdDelete from '~icons/mdi/delete'
  import MdFolder from '~icons/mdi/folder-open'
  import MdSports from '~icons/mdi/basketball'
  import MdMuseum from '~icons/mdi/bank'
  import MdSchool from '~icons/mdi/school'
  import MdWalk from '~icons/mdi/walk'
  import MdVideo from '~icons/mdi/video-vintage'
  import MdChevronDown from '~icons/mdi/chevron-down'
  import MdChevronRight from '~icons/mdi/chevron-right'
  import MdMoreVert from '~icons/mdi/dots-vertical'
  import MdMenu from '~icons/mdi/menu'
  import MdClose from '~icons/mdi/close'

  import type { User } from '../models/user'

  import UserStore from '../stores/userStore'
  import P5Store from '../stores/p5Store'
  import VideoStore, {
    toggleVisibility,
    reset as resetVideo,
    hasVideoSource,
  } from '../stores/videoStore'
  import { resetGPS } from '../stores/gpsStore'
  import { onVideoVisibilityChange } from '../stores/playbackStore'
  import VideoContainer from '$lib/components/VideoContainer.svelte'
  import SplitScreenVideo from '$lib/components/SplitScreenVideo.svelte'
  import TranscriptPanel from '$lib/components/TranscriptPanel.svelte'
  import ConversationTooltip from '$lib/components/ConversationTooltip.svelte'

  import { Core } from '$lib'
  import { EXAMPLE_DATASETS } from '$lib/core/example-datasets'
  import { igsSketch } from '$lib/p5/igsSketch'
  import { writable } from 'svelte/store'
  import { onMount } from 'svelte'
  import IconButton from '$lib/components/IconButton.svelte'
  import IgsInfoModal from '$lib/components/IGSInfoModal.svelte'
  import { TimelineContainer } from '$lib/timeline'
  import DataPointTable from '$lib/components/DataPointTable.svelte'
  import ModeIndicator from '$lib/components/ModeIndicator.svelte'
  import FloatingDropdown from '$lib/components/FloatingDropdown.svelte'
  import { OnboardingTour } from '$lib/tour'
  import DataImporter from '$lib/components/import/DataImporter.svelte'
  import MapStyleSelector from '$lib/components/MapStyleSelector.svelte'
  import { capitalizeFirstLetter, capitalizeEachWord } from '$lib/utils/string'

  import CodeStore from '../stores/codeStore'
  import ConfigStore from '../stores/configStore'
  import type { ConfigStoreType } from '../stores/configStore'
  import { timelineV2Store } from '$lib/timeline/store'
  import { initialConfig } from '../stores/configStore'
  import { computePosition, flip, shift, offset } from '@floating-ui/dom'
  import { setSelectorSize, setSlicerSize, toggleColorMode } from '$lib/history/config-actions'
  import {
    toggleUserEnabled,
    toggleUserConversationEnabled,
    setUserColor,
    setUserEnabled,
    setUserConversationEnabled,
  } from '$lib/history/user-actions'
  import {
    clearUsers,
    clearCodes,
    clearAllData as clearAllDataWithHistory,
    setCodeEnabled,
    toggleAllCodes,
    setCodeColor,
  } from '$lib/history/data-actions'

  // Define ToggleKey type to fix TypeScript errors
  type ToggleKey = string

  const filterToggleOptions = ['movementToggle', 'stopsToggle'] as const
  const selectToggleOptions = ['circleToggle', 'sliceToggle', 'highlightToggle'] as const
  const conversationToggleOptions = ['alignToggle'] as const
  let selectedDropDownOption = $state('')
  const dropdownOptions = [
    {
      label: 'Sports',
      icon: MdSports,
      items: [{ value: 'example-1', label: "Michael Jordan's Last Shot" }],
    },
    {
      label: 'Museums',
      icon: MdMuseum,
      items: [
        { value: 'example-2', label: 'Single Gallery' },
        { value: 'example-11', label: 'Complete Visit' },
      ],
    },
    {
      label: 'Classrooms',
      icon: MdSchool,
      items: [
        { value: 'example-10', label: '8th Grade AP Math Lesson' },
        { value: 'example-4', label: '3rd Grade Discussion Odd/Even Numbers' },
      ],
    },
    {
      label: 'Walking Tours',
      icon: MdWalk,
      items: [
        { value: 'example-14', label: 'Jefferson Street Tour' },
        { value: 'example-12', label: 'Civil Rights Tour: Creating the Route' },
        { value: 'example-13', label: 'Civil Rights Tour: Walking the Route' },
      ],
    },
    {
      label: 'TIMSS Classroom Video Study',
      icon: MdVideo,
      items: [
        { value: 'example-3', label: 'US: Weather' },
        { value: 'example-5', label: 'Czech: Density' },
        { value: 'example-6', label: 'Japan: Angles' },
        { value: 'example-7', label: 'US: Linear Equations' },
        { value: 'example-8', label: 'US: Rocks' },
        { value: 'example-9', label: 'Netherlands: Pythagorean Theorem' },
      ],
    },
  ]

  // Helper to get dataset duration
  function getDatasetDuration(value: string) {
    return EXAMPLE_DATASETS[value]?.duration ?? ''
  }

  // Track which categories are expanded (all expanded by default)
  let expandedCategories = $state<Set<string>>(new Set(dropdownOptions.map((g) => g.label)))

  function toggleCategory(label: string) {
    const newSet = new Set(expandedCategories)
    if (newSet.has(label)) {
      newSet.delete(label)
    } else {
      newSet.add(label)
    }
    expandedCategories = newSet
  }

  let showDataPopup = $state(false)
  let showSettings = $state(false)
  let showImportDialog = $state(false)
  let currentConfig = $state<ConfigStoreType>($ConfigStore)

  let users = $state<User[]>([])
  let p5Instance = $state<p5 | null>(null)
  let core: Core
  let isVideoShowing = $state(false)
  let isVideoPlaying = $state(false)
  let is3DMode = $state(true)
  let timelineEndTime = $state(0)
  let isTranscriptVisible = $state(true)
  let mobileMenuOpen = $state(false)

  $effect(() => {
    currentConfig = $ConfigStore
  })

  $effect(() => {
    const unsubscribe = timelineV2Store.subscribe((state) => {
      timelineEndTime = state.dataEnd
    })
    return unsubscribe
  })

  let isSplitScreen = $state(false)
  let splitWidth = $state(40) // percentage
  let isDraggingSplit = $state(false)
  let prevSplitScreen = false

  $effect(() => {
    const videoState = $VideoStore
    isVideoShowing = videoState.isVisible
    isVideoPlaying = videoState.isPlaying
    isSplitScreen = videoState.isSplitScreen

    // Trigger canvas resize when entering/exiting split-screen
    if (isSplitScreen !== prevSplitScreen) {
      prevSplitScreen = isSplitScreen
      // Wait for DOM to update, then trigger a window resize event
      // This lets the native p5 windowResized handler work, which
      // combined with CSS clipping handles split-screen correctly
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 150)
    }
  })

  function handleSplitDividerMouseDown(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    isDraggingSplit = true
    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  function handleGlobalMouseMove(e: MouseEvent) {
    if (!isDraggingSplit) return
    e.preventDefault()

    const container = document.getElementById('main-content')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    let newPercent = (x / rect.width) * 100

    // Constrain between 20% and 80%
    newPercent = Math.max(20, Math.min(80, newPercent))
    splitWidth = newPercent

    // Trigger redraw - canvas stays full width, CSS handles clipping
    p5Instance?.loop()
  }

  function handleGlobalMouseUp() {
    if (isDraggingSplit) {
      isDraggingSplit = false
      // Restore normal selection and cursor
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      // Final redraw
      p5Instance?.loop()
    }
  }

  $effect(() => {
    users = $UserStore
  })

  $effect(() => {
    p5Instance = $P5Store
    if (p5Instance) {
      core = new Core(p5Instance)
    }
  })

  const sketch: Sketch = (p5: p5) => {
    igsSketch(p5)
  }

  // Start with modal closed - it will open after tour completes
  let isModalOpen = writable(false)

  let sortedCodes = $derived(
    [...$CodeStore].sort((a, b) => {
      if (a.code.toLowerCase() === 'no codes') return 1
      if (b.code.toLowerCase() === 'no codes') return -1
      return a.code.localeCompare(b.code)
    })
  )

  let formattedStopLength = $derived($ConfigStore.stopSliderValue.toFixed(0))

  function toggleVideo() {
    if (!hasVideoSource()) return

    const willBeVisible = !$VideoStore.isVisible
    toggleVisibility()
    onVideoVisibilityChange(willBeVisible)
  }

  function resetSettings() {
    ConfigStore.update(() => ({ ...initialConfig }))

    if (p5Instance) {
      p5Instance.loop()
    }
  }

  function handleConfigChangeFromInput(e: Event, key: keyof ConfigStoreType) {
    const target = e.target as HTMLInputElement
    ConfigStore.update((value) => ({ ...value, [key]: parseFloat(target.value) }))
    p5Instance?.loop() // Trigger redraw
  }

  function handleConfigChange(key: keyof ConfigStoreType, value: any) {
    ConfigStore.update((store) => ({ ...store, [key]: value }))
    p5Instance?.loop()
  }

  function toggleSelection(selection: ToggleKey, toggleOptions: ToggleKey[]) {
    ConfigStore.update((store: ConfigStoreType) => {
      const updatedStore = { ...store }
      toggleOptions.forEach((key) => {
        if (key.endsWith('Toggle')) {
          updatedStore[key] = key === selection ? !updatedStore[key] : false
        }
      })
      return updatedStore
    })
    p5Instance?.loop()
  }

  function toggleSelectAllCodes() {
    toggleAllCodes()
    p5Instance.loop()
  }

  function clickOutside(node) {
    const handleClick = (event) => {
      if (!node.contains(event.target)) {
        node.removeAttribute('open')
      }
    }

    document.addEventListener('click', handleClick, true)

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true)
      },
    }
  }

  /**
   * Detect CSV file type by reading headers
   * Returns: 'movement' | 'conversation' | 'multicode' | 'singlecode' | 'unknown'
   */
  async function detectCsvFileType(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (!content) {
          resolve('unknown')
          return
        }

        // Get first line (headers) and normalize
        const firstLine = content.split('\n')[0] || ''
        const headers = firstLine
          .toLowerCase()
          .split(',')
          .map((h) => h.trim().replace(/"/g, ''))

        // Check for GPS movement: time, lat, lng (or latitude, longitude)
        if (
          headers.includes('time') &&
          (headers.includes('lat') || headers.includes('latitude')) &&
          (headers.includes('lng') || headers.includes('longitude'))
        ) {
          resolve('movement')
          return
        }

        // Check for movement: time, x, y
        if (headers.includes('time') && headers.includes('x') && headers.includes('y')) {
          resolve('movement')
          return
        }

        // Check for conversation: time, speaker, talk
        if (headers.includes('time') && headers.includes('speaker') && headers.includes('talk')) {
          resolve('conversation')
          return
        }

        // Check for multicode: code, start, end (must check before singlecode)
        if (headers.includes('code') && headers.includes('start') && headers.includes('end')) {
          resolve('multicode')
          return
        }

        // Check for singlecode: start, end
        if (headers.includes('start') && headers.includes('end')) {
          resolve('singlecode')
          return
        }

        resolve('unknown')
      }
      reader.onerror = () => resolve('unknown')
      // Only read first 1KB to get headers
      reader.readAsText(file.slice(0, 1024))
    })
  }

  /**
   * Sort files by processing priority:
   * 1. Non-CSV files (images, videos) - process first
   * 2. Movement CSV files
   * 3. Conversation CSV files
   * 4. Code CSV files (multicode and singlecode) - process last
   */
  async function sortFilesByProcessingOrder(files: File[]): Promise<File[]> {
    const fileTypes: Array<{ file: File; type: string; priority: number }> = []

    for (const file of files) {
      const ext = file.name.toLowerCase().split('.').pop() || ''

      if (ext !== 'csv') {
        // Non-CSV files get highest priority (processed first)
        fileTypes.push({ file, type: 'non-csv', priority: 0 })
      } else {
        const csvType = await detectCsvFileType(file)
        let priority: number

        switch (csvType) {
          case 'movement':
            priority = 1
            break
          case 'conversation':
            priority = 2
            break
          case 'multicode':
          case 'singlecode':
            priority = 3 // Code files processed last
            break
          default:
            priority = 4 // Unknown CSV files last
        }

        fileTypes.push({ file, type: csvType, priority })
      }
    }

    // Sort by priority (ascending)
    fileTypes.sort((a, b) => a.priority - b.priority)

    return fileTypes.map((ft) => ft.file)
  }

  async function handleImportFiles(files: File[], clearExisting: boolean) {
    // Clear existing data if requested
    if (clearExisting) {
      clearAllDataLocal()
    }

    // Sort files to ensure correct processing order:
    // movement files first, conversation second, code files last
    const sortedFiles = await sortFilesByProcessingOrder(files)

    // Process each file SEQUENTIALLY using the async file handler
    // This ensures movement data is loaded before conversation,
    // and conversation is loaded before codes
    for (const file of sortedFiles) {
      await core.testFileTypeForProcessingAsync(file)
    }

    // Trigger redraw
    p5Instance?.loop()
  }

  async function updateExampleDataDropDown(event) {
    clearAllDataLocal()
    await core.handleExampleDropdown(event)
    p5Instance.loop()
  }

  // Local version that handles UI cleanup and non-store data
  function clearAllDataLocal() {
    resetVideo()
    resetGPS()
    currentConfig.isPathColorMode = false

    closeAllDropdowns()

    // Use history-tracked function for store clearing
    clearAllDataWithHistory()

    core.codeData = []
    core.movementData = []
    core.conversationData = []

    ConfigStore.update((currentConfig) => ({ ...currentConfig, dataHasCodes: false }))

    // Recreate canvas to get fresh WebGL context (helps Safari performance)
    if (p5Instance?.recreateCanvas) {
      p5Instance.recreateCanvas()
    }
  }

  function clearMovementData() {
    clearUsers()
    core.movementData = []
    p5Instance.loop()
  }

  function clearConversationData() {
    UserStore.update((users) =>
      users.map((user) => {
        user.conversationIsLoaded = false
        user.dataTrail = user.dataTrail.map((dataPoint) => {
          dataPoint.speech = ''
          return dataPoint
        })
        return user
      })
    )
    core.conversationData = []
    p5Instance.loop()
  }

  function clearCodeData() {
    clearCodes()
    core.codeData = []
    UserStore.update((users) =>
      users.map((user) => {
        user.dataTrail = user.dataTrail.map((dataPoint) => {
          dataPoint.codes = []
          return dataPoint
        })
        return user
      })
    )

    ConfigStore.update((currentConfig) => ({ ...currentConfig, dataHasCodes: false }))
    p5Instance.loop()
  }

  // Track which dropdown is currently open
  let openDropdownId = $state<string | null>(null)

  function closeAllDropdowns() {
    // If no dropdown is open, do nothing
    if (!openDropdownId) return

    // Get the currently open dropdown
    const dropdown = document.getElementById(openDropdownId)
    if (dropdown) {
      dropdown.classList.add('hidden')

      // If it's in the body, move it back to its original position
      if (dropdown.parentNode === document.body) {
        const parentId = openDropdownId.replace('dropdown-', 'dropdown-container-')
        const parent = document.getElementById(parentId)
        if (parent) {
          parent.appendChild(dropdown)
        }
      }
    }

    openDropdownId = null
  }

  function toggleDropdown(id: string, buttonId: string) {
    const dropdown = document.getElementById(id)
    const button = document.getElementById(buttonId)

    if (!dropdown || !button) return

    const isCurrentlyOpen = openDropdownId === id

    // Close all dropdowns first
    closeAllDropdowns()

    // If this dropdown wasn't already open, open it
    if (!isCurrentlyOpen) {
      // Show the dropdown
      dropdown.classList.remove('hidden')

      // Move dropdown to body to avoid clipping by overflow
      document.body.appendChild(dropdown)

      // Position the dropdown using Floating UI
      computePosition(button, dropdown, {
        placement: 'top',
        middleware: [offset(6), flip(), shift({ padding: 5 })],
      }).then(({ x, y }) => {
        Object.assign(dropdown.style, {
          left: `${x}px`,
          top: `${y}px`,
          position: 'absolute',
          zIndex: '9999', // Higher z-index to ensure it's above canvas
        })
      })

      openDropdownId = id
    }
  }

  /**
   * Check if a user is visible (either movement or talk enabled)
   */
  function isUserVisible(user: User): boolean {
    return user.enabled || user.conversation_enabled
  }

  /**
   * Toggle both movement and talk visibility for a user
   */
  function toggleUserVisibility(user: User) {
    const currentlyVisible = isUserVisible(user)
    // If either is on, turn both off. If both are off, turn both on.
    setUserEnabled(user.name, !currentlyVisible)
    setUserConversationEnabled(user.name, !currentlyVisible)
    p5Instance?.loop()
  }

  // Add event handlers for dropdowns
  onMount(() => {
    // Global click handler to close dropdowns when clicking outside
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isButton =
        document.getElementById('btn-codes')?.contains(target) ||
        Array.from($UserStore).some((user) => {
          const button = document.getElementById(`btn-${user.name}`)
          return button && button.contains(target)
        })

      const isInsideDropdown =
        document.getElementById('dropdown-codes')?.contains(target) ||
        Array.from($UserStore).some((user) => {
          const dropdown = document.getElementById(`dropdown-${user.name}`)
          return dropdown && dropdown.contains(target)
        })

      if (!isButton && !isInsideDropdown) {
        closeAllDropdowns()
      }
    }

    document.addEventListener('click', handleGlobalClick)

    // Scroll handler to close dropdowns when scrolling
    const handleScroll = () => {
      closeAllDropdowns()
    }

    const userContainer = document.querySelector('.btm-nav .overflow-x-auto')
    if (userContainer) {
      userContainer.addEventListener('scroll', handleScroll)
    }

    // Keyboard shortcut event handlers
    const handleToggle3D = () => {
      if (p5Instance?.handle3D) {
        p5Instance.handle3D.update()
        is3DMode = p5Instance.handle3D.getIs3DMode()
      }
    }

    const handleRotateFloorplan = (event: Event) => {
      const customEvent = event as CustomEvent<{ direction: 'left' | 'right' }>
      if (p5Instance?.floorPlan) {
        if (customEvent.detail.direction === 'left') {
          p5Instance.floorPlan.setRotateLeft()
        } else {
          p5Instance.floorPlan.setRotateRight()
        }
        p5Instance.loop()
      }
    }

    const handleToggleVideo = () => {
      toggleVideo()
    }

    const handleDownloadCodes = () => {
      if (p5Instance) {
        p5Instance.saveCodeFile()
      }
    }

    const handleToggleHelp = () => {
      isModalOpen.update((value) => !value)
    }

    const handleLoadExample = (event: Event) => {
      const customEvent = event as CustomEvent<{ value: string }>
      if (customEvent.detail?.value) {
        updateExampleDataDropDown({ target: { value: customEvent.detail.value } })
      }
    }

    // Handler to show modal after tour completes
    const handleTourComplete = () => {
      isModalOpen.set(true)
    }

    // Register event listeners
    window.addEventListener('igs:toggle-3d', handleToggle3D)
    window.addEventListener('igs:rotate-floorplan', handleRotateFloorplan)
    window.addEventListener('igs:toggle-video', handleToggleVideo)
    window.addEventListener('igs:download-codes', handleDownloadCodes)
    window.addEventListener('igs:toggle-help', handleToggleHelp)
    window.addEventListener('igs:load-example', handleLoadExample)
    window.addEventListener('tour-complete', handleTourComplete)

    // Cleanup function
    return () => {
      // Remove global click handler
      document.removeEventListener('click', handleGlobalClick)

      // Remove scroll handler
      if (userContainer) {
        userContainer.removeEventListener('scroll', handleScroll)
      }

      // Remove keyboard shortcut handlers
      window.removeEventListener('igs:toggle-3d', handleToggle3D)
      window.removeEventListener('igs:rotate-floorplan', handleRotateFloorplan)
      window.removeEventListener('igs:toggle-video', handleToggleVideo)
      window.removeEventListener('igs:download-codes', handleDownloadCodes)
      window.removeEventListener('igs:toggle-help', handleToggleHelp)
      window.removeEventListener('igs:load-example', handleLoadExample)
      window.removeEventListener('tour-complete', handleTourComplete)
    }
  })
</script>

{#snippet chevronDown()}
  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
  </svg>
{/snippet}

{#snippet icon(Icon: any)}
  <div class="w-4 h-4"><Icon /></div>
{/snippet}

{#snippet check(condition: boolean)}
  <div class="w-4 h-4 mr-2">
    {#if condition}<MdCheck />{/if}
  </div>
{/snippet}

{#snippet navDivider()}
  <div class="divider divider-horizontal mx-2 h-6 self-center"></div>
{/snippet}

<svelte:head>
  <title>IGS</title>
</svelte:head>

<svelte:window onmousemove={handleGlobalMouseMove} onmouseup={handleGlobalMouseUp} />

<div class="navbar min-h-16 bg-[#ffffff] relative">
  <div class="flex-1 px-2 lg:flex-none">
    <a class="text-2xl font-bold text-black italic" href="https://interactiongeography.org">IGS</a>
  </div>

  <!-- Hamburger button - visible on mobile only, positioned to the right -->
  <div class="flex-none lg:hidden">
    <button
      class="btn btn-ghost btn-square"
      onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
      aria-label="Toggle menu"
    >
      <div class="w-6 h-6">
        {#if mobileMenuOpen}
          <MdClose />
        {:else}
          <MdMenu />
        {/if}
      </div>
    </button>
  </div>

  <!-- Desktop menu - hidden on mobile -->
  <div class="hidden lg:flex items-center justify-end flex-1 px-2">
    <details class="dropdown" use:clickOutside>
      <summary class="btn btn-sm ml-4 gap-1 flex items-center">
        {@render icon(MdFilterList)}
        Filter
        {@render chevronDown()}
      </summary>
      <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
        {#each filterToggleOptions as toggle}
          <li>
            <button
              onclick={() => toggleSelection(toggle, filterToggleOptions)}
              class="w-full text-left flex items-center"
            >
              {@render check($ConfigStore[toggle])}
              {capitalizeFirstLetter(toggle.replace('Toggle', ''))}
            </button>
          </li>
        {/each}
        <li class="cursor-none">
          <p>Stop Length: {formattedStopLength} sec</p>
        </li>
        <li>
          <label for="stopLengthRange" class="sr-only">Adjust stop length</label>
          <input
            id="stopLengthRange"
            type="range"
            min="1"
            max={$ConfigStore.maxStopLength}
            value={$ConfigStore.stopSliderValue}
            class="range"
            oninput={(e) => handleConfigChangeFromInput(e, 'stopSliderValue')}
          />
        </li>
      </ul>
    </details>

    <!-- Select Dropdown (only shown in 2D mode) -->
    {#if !is3DMode}
      <details class="dropdown" use:clickOutside>
        <summary class="btn btn-sm ml-4 gap-1 flex items-center">
          {@render icon(MdSelectAll)}
          Select
          {@render chevronDown()}
        </summary>
        <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
          {#each selectToggleOptions as toggle}
            <li>
              <button
                onclick={() => toggleSelection(toggle, selectToggleOptions)}
                class="w-full text-left flex items-center"
              >
                {@render check($ConfigStore[toggle])}
                {capitalizeFirstLetter(toggle.replace('Toggle', ''))}
              </button>
            </li>
          {/each}
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
              oninput={(e) => setSelectorSize(parseFloat(e.target.value))}
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
              oninput={(e) => setSlicerSize(parseFloat(e.target.value))}
              class="range range-sm w-full"
            />
          </li>
        </ul>
      </details>
    {/if}

    <!-- Talk Dropdown -->
    <details id="talk-dropdown" class="dropdown" use:clickOutside>
      <summary class="btn btn-sm ml-4 gap-1 flex items-center">
        {@render icon(MdChat)}
        Talk
        {@render chevronDown()}
      </summary>
      <ul class="menu dropdown-content rounded-box z-[1] w-64 p-2 shadow bg-base-100">
        <li>
          <button
            onclick={() => (isTranscriptVisible = !isTranscriptVisible)}
            class="w-full text-left flex items-center"
          >
            {@render check(isTranscriptVisible)}
            Transcript Panel
          </button>
        </li>
        <li>
          <button
            onclick={() => toggleSelection('alignToggle', conversationToggleOptions)}
            class="w-full text-left flex items-center"
          >
            {@render check($ConfigStore.alignToggle)}
            Align to side
          </button>
        </li>

        <div class="divider my-1"></div>
        <li class="menu-title px-2 py-0 text-xs opacity-60">Grouped turns</li>

        <li>
          <button
            onclick={() => {
              handleConfigChange('showSpeakerStripes', !$ConfigStore.showSpeakerStripes)
            }}
            class="w-full text-left flex items-center"
          >
            {@render check($ConfigStore.showSpeakerStripes)}
            Combine speakers
          </button>
        </li>
        <li class="px-2 py-1">
          <div class="w-full">
            <p class="text-xs mb-1">Group within {$ConfigStore.clusterTimeThreshold} seconds</p>
            <input
              id="clusterTimeRange"
              type="range"
              min="1"
              max="60"
              value={$ConfigStore.clusterTimeThreshold}
              class="range range-xs"
              oninput={(e) => handleConfigChangeFromInput(e, 'clusterTimeThreshold')}
            />
          </div>
        </li>
        <li class="px-2 py-1">
          <div class="w-full">
            <p class="text-xs mb-1">Group within {$ConfigStore.clusterSpaceThreshold}px distance</p>
            <input
              id="clusterSpaceRange"
              type="range"
              min="0"
              max="200"
              value={$ConfigStore.clusterSpaceThreshold}
              class="range range-xs"
              oninput={(e) => handleConfigChangeFromInput(e, 'clusterSpaceThreshold')}
            />
          </div>
        </li>

        <div class="divider my-1"></div>
        <li class="menu-title px-2 py-0 text-xs opacity-60">Individual turns</li>

        <li class="px-2 py-1">
          <div class="w-full">
            <p class="text-xs mb-1">Turn width: {$ConfigStore.conversationRectWidth}px</p>
            <input
              id="rectWidthRange"
              type="range"
              min="1"
              max="30"
              value={$ConfigStore.conversationRectWidth}
              class="range range-xs"
              oninput={(e) => handleConfigChangeFromInput(e, 'conversationRectWidth')}
            />
          </div>
        </li>
      </ul>
    </details>

    <!-- Map Style Selector (GPS mode only) -->
    <MapStyleSelector />

    <!-- Clear Data Dropdown -->
    <details class="dropdown" use:clickOutside>
      <summary class="btn btn-sm ml-4 gap-1 flex items-center">
        {@render icon(MdDelete)}
        Clear
        {@render chevronDown()}
      </summary>
      <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
        <li><button onclick={clearMovementData}>Movement</button></li>
        <li><button onclick={clearConversationData}>Conversation</button></li>
        <li><button onclick={clearCodeData}>Codes</button></li>
        <li><button onclick={resetVideo}>Video</button></li>
        <li><button onclick={clearAllDataLocal} class="text-error">All Data</button></li>
      </ul>
    </details>

    {@render navDivider()}

    <div class="flex items-center gap-1">
      <IconButton
        id="btn-rotate-left"
        icon={MdRotateLeft}
        tooltip={'Rotate Left'}
        onclick={() => {
          p5Instance.floorPlan.setRotateLeft()
          p5Instance.loop()
        }}
      />
      <IconButton
        id="btn-rotate-right"
        icon={MdRotateRight}
        tooltip={'Rotate Right'}
        onclick={() => {
          p5Instance.floorPlan.setRotateRight()
          p5Instance.loop()
        }}
      />
      <IconButton
        id="btn-aspect-ratio"
        icon={currentConfig.preserveFloorplanAspectRatio ? MdAspectRatio : MdFitToPageOutline}
        tooltip={currentConfig.preserveFloorplanAspectRatio ? 'Stretch to Fill' : 'Preserve Aspect Ratio'}
        onclick={() => {
          handleConfigChange('preserveFloorplanAspectRatio', !currentConfig.preserveFloorplanAspectRatio)
          p5Instance?.loop()
        }}
      />
      <IconButton
        id="btn-toggle-3d"
        icon={Md3DRotation}
        tooltip={'Toggle 2D/3D'}
        onclick={() => {
          p5Instance.handle3D.update()
          is3DMode = p5Instance.handle3D.getIs3DMode()
        }}
      />
      <IconButton
        id="btn-toggle-video"
        icon={isVideoShowing ? MdVideocam : MdVideocamOff}
        tooltip={'Show/Hide Video'}
        onclick={toggleVideo}
      />
      <IconButton
        icon={MdFileUploadOutline}
        tooltip={'Import Files'}
        onclick={() => (showImportDialog = true)}
      />

      <IconButton
        icon={MdHelpOutline}
        tooltip={'Help'}
        onclick={() => ($isModalOpen = !$isModalOpen)}
      />

      <!-- More menu (Download, Keyboard, Settings) -->
      <details class="dropdown dropdown-end" use:clickOutside>
        <summary class="btn btn-sm btn-ghost btn-square">
          <div class="w-5 h-5"><MdMoreVert /></div>
        </summary>
        <ul class="menu dropdown-content rounded-box z-[1] w-48 p-2 shadow bg-base-100">
          <li>
            <button onclick={() => p5Instance.saveCodeFile()} class="flex items-center gap-2">
              {@render icon(MdCloudDownload)}
              Download Codes
            </button>
          </li>
          <li>
            <button
              onclick={() => window.dispatchEvent(new CustomEvent('igs:open-cheatsheet'))}
              class="flex items-center gap-2"
            >
              {@render icon(MdKeyboard)}
              Keyboard Shortcuts
            </button>
          </li>
          <li>
            <button onclick={() => (showSettings = true)} class="flex items-center gap-2">
              {@render icon(MdSettings)}
              Settings
            </button>
          </li>
        </ul>
      </details>

      {@render navDivider()}

      <!-- Examples Dropdown -->
      <FloatingDropdown
        id="examples-dropdown"
        buttonClass="btn btn-sm gap-1 flex items-center"
        contentClass="menu rounded-box w-72 p-2 shadow bg-base-100 max-h-[60vh] overflow-y-auto"
      >
        {#snippet buttonChildren()}
          {@render icon(MdFolder)}
          <span class="max-w-32 truncate">{selectedDropDownOption || 'Examples'}</span>
          {@render chevronDown()}
        {/snippet}
        <ul>
          {#each dropdownOptions as group, groupIndex}
            {#if groupIndex > 0}
              <li class="my-1"><hr class="border-base-300" /></li>
            {/if}
            <li>
              <button
                class="menu-title flex items-center gap-2 w-full hover:bg-base-200 rounded-lg px-2 py-1 cursor-pointer"
                onclick={() => toggleCategory(group.label)}
              >
                <svelte:component
                  this={expandedCategories.has(group.label) ? MdChevronDown : MdChevronRight}
                  class="w-4 h-4 opacity-50"
                />
                <svelte:component this={group.icon} class="w-4 h-4" />
                <span>{group.label}</span>
              </button>
            </li>
            {#if expandedCategories.has(group.label)}
              {#each group.items as item}
                {@const isSelected = selectedDropDownOption === item.label}
                <li class="pl-2 w-full">
                  <button
                    onclick={() => {
                      updateExampleDataDropDown({ target: { value: item.value } })
                      selectedDropDownOption = item.label
                    }}
                    class="flex items-center gap-2 w-full cursor-pointer {isSelected
                      ? 'bg-primary/20 font-medium'
                      : ''}"
                  >
                    <span class="truncate flex-1">{item.label}</span>
                    <span class="badge badge-ghost badge-sm opacity-60 shrink-0"
                      >{getDatasetDuration(item.value)}</span
                    >
                  </button>
                </li>
              {/each}
            {/if}
          {/each}
        </ul>
      </FloatingDropdown>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if mobileMenuOpen}
    <!-- Backdrop -->
    <div
      class="lg:hidden fixed inset-0 bg-black/20 z-40"
      onclick={() => (mobileMenuOpen = false)}
      role="button"
      tabindex="-1"
    ></div>

    <!-- Menu panel -->
    <div
      class="lg:hidden absolute top-full left-0 right-0 bg-base-100 shadow-lg border-t z-50 max-h-[85vh] overflow-y-auto px-6 py-8"
    >
      <!-- Dropdown buttons -->
      <div class="flex flex-wrap gap-2 justify-center mb-6">
        <details class="dropdown dropdown-bottom" use:clickOutside>
          <summary class="btn btn-sm gap-1">{@render icon(MdFilterList)}Filter</summary>
          <ul class="dropdown-content menu bg-base-200 rounded-box z-[60] w-48 p-2 shadow mt-1">
            {#each filterToggleOptions as toggle}
              <li>
                <button onclick={() => toggleSelection(toggle, filterToggleOptions)}
                  >{@render check($ConfigStore[toggle])}{capitalizeFirstLetter(
                    toggle.replace('Toggle', '')
                  )}</button
                >
              </li>
            {/each}
            <li class="px-2 py-1">
              <div class="flex flex-col w-full">
                <span class="text-xs">Stop: {formattedStopLength}s</span>
                <input
                  type="range"
                  min="1"
                  max={$ConfigStore.maxStopLength}
                  value={$ConfigStore.stopSliderValue}
                  class="range range-xs"
                  oninput={(e) => handleConfigChangeFromInput(e, 'stopSliderValue')}
                />
              </div>
            </li>
          </ul>
        </details>

        {#if !is3DMode}
          <details class="dropdown dropdown-bottom" use:clickOutside>
            <summary class="btn btn-sm gap-1">{@render icon(MdSelectAll)}Select</summary>
            <ul class="dropdown-content menu bg-base-200 rounded-box z-[60] w-56 p-2 shadow mt-1">
              {#each selectToggleOptions as toggle}
                <li>
                  <button onclick={() => toggleSelection(toggle, selectToggleOptions)}
                    >{@render check($ConfigStore[toggle])}{capitalizeFirstLetter(
                      toggle.replace('Toggle', '')
                    )}</button
                  >
                </li>
              {/each}
              <li class="px-2 py-1">
                <div class="w-full">
                  <p class="text-xs mb-1">Circle Size: {currentConfig.selectorSize}px</p>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="10"
                    bind:value={currentConfig.selectorSize}
                    oninput={(e) => setSelectorSize(parseFloat(e.target.value))}
                    class="range range-xs"
                  />
                </div>
              </li>
              <li class="px-2 py-1">
                <div class="w-full">
                  <p class="text-xs mb-1">Slicer Width: {currentConfig.slicerSize}px</p>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    bind:value={currentConfig.slicerSize}
                    oninput={(e) => setSlicerSize(parseFloat(e.target.value))}
                    class="range range-xs"
                  />
                </div>
              </li>
            </ul>
          </details>
        {/if}

        <details class="dropdown dropdown-bottom" use:clickOutside>
          <summary class="btn btn-sm gap-1">{@render icon(MdChat)}Talk</summary>
          <ul class="dropdown-content menu bg-base-200 rounded-box z-[60] w-64 p-2 shadow mt-1">
            <li>
              <button onclick={() => (isTranscriptVisible = !isTranscriptVisible)}
                >{@render check(isTranscriptVisible)}Transcript</button
              >
            </li>
            <li>
              <button onclick={() => toggleSelection('alignToggle', conversationToggleOptions)}
                >{@render check($ConfigStore.alignToggle)}Align to side</button
              >
            </li>
            <div class="divider my-1"></div>
            <li class="menu-title px-2 py-0 text-xs opacity-60">Grouped turns</li>
            <li>
              <button
                onclick={() =>
                  handleConfigChange('showSpeakerStripes', !$ConfigStore.showSpeakerStripes)}
                >{@render check($ConfigStore.showSpeakerStripes)}Combine speakers</button
              >
            </li>
            <li class="px-2 py-1">
              <div class="w-full">
                <p class="text-xs mb-1">Group within {$ConfigStore.clusterTimeThreshold} seconds</p>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={$ConfigStore.clusterTimeThreshold}
                  class="range range-xs"
                  oninput={(e) => handleConfigChangeFromInput(e, 'clusterTimeThreshold')}
                />
              </div>
            </li>
            <li class="px-2 py-1">
              <div class="w-full">
                <p class="text-xs mb-1">
                  Group within {$ConfigStore.clusterSpaceThreshold}px distance
                </p>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={$ConfigStore.clusterSpaceThreshold}
                  class="range range-xs"
                  oninput={(e) => handleConfigChangeFromInput(e, 'clusterSpaceThreshold')}
                />
              </div>
            </li>
            <div class="divider my-1"></div>
            <li class="menu-title px-2 py-0 text-xs opacity-60">Individual turns</li>
            <li class="px-2 py-1">
              <div class="w-full">
                <p class="text-xs mb-1">Turn width: {$ConfigStore.conversationRectWidth}px</p>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={$ConfigStore.conversationRectWidth}
                  class="range range-xs"
                  oninput={(e) => handleConfigChangeFromInput(e, 'conversationRectWidth')}
                />
              </div>
            </li>
          </ul>
        </details>

        <details class="dropdown dropdown-bottom dropdown-end" use:clickOutside>
          <summary class="btn btn-sm gap-1">{@render icon(MdDelete)}Clear</summary>
          <ul class="dropdown-content menu bg-base-200 rounded-box z-[60] w-40 p-2 shadow mt-1">
            <li>
              <button
                onclick={() => {
                  clearMovementData()
                  mobileMenuOpen = false
                }}>Movement</button
              >
            </li>
            <li>
              <button
                onclick={() => {
                  clearConversationData()
                  mobileMenuOpen = false
                }}>Conversation</button
              >
            </li>
            <li>
              <button
                onclick={() => {
                  clearCodeData()
                  mobileMenuOpen = false
                }}>Codes</button
              >
            </li>
            <li>
              <button
                onclick={() => {
                  resetVideo()
                  mobileMenuOpen = false
                }}>Video</button
              >
            </li>
            <li>
              <button
                onclick={() => {
                  clearAllDataLocal()
                  mobileMenuOpen = false
                }}
                class="text-error">All Data</button
              >
            </li>
          </ul>
        </details>

        <details class="dropdown dropdown-bottom" use:clickOutside>
          <summary class="btn btn-sm gap-1"
            >{@render icon(MdFolder)}{selectedDropDownOption || 'Examples'}</summary
          >
          <ul
            class="dropdown-content menu bg-base-200 rounded-box z-[60] w-72 p-2 shadow mt-1 max-h-60 overflow-y-auto"
          >
            {#each dropdownOptions as group, groupIndex}
              {#if groupIndex > 0}
                <li class="my-1"><hr class="border-base-300" /></li>
              {/if}
              <li>
                <button
                  class="menu-title flex items-center gap-2 w-full hover:bg-base-300 rounded-lg px-2 py-1 cursor-pointer text-xs"
                  onclick={() => toggleCategory(group.label)}
                >
                  <svelte:component
                    this={expandedCategories.has(group.label) ? MdChevronDown : MdChevronRight}
                    class="w-4 h-4 opacity-50"
                  />
                  <svelte:component this={group.icon} class="w-4 h-4" />
                  <span>{group.label}</span>
                </button>
              </li>
              {#if expandedCategories.has(group.label)}
                {#each group.items as item}
                  {@const isSelected = selectedDropDownOption === item.label}
                  <li class="pl-2 w-full">
                    <button
                      onclick={() => {
                        updateExampleDataDropDown({ target: { value: item.value } })
                        selectedDropDownOption = item.label
                        mobileMenuOpen = false
                      }}
                      class="flex items-center gap-2 w-full cursor-pointer {isSelected
                        ? 'bg-primary/20 font-medium'
                        : ''}"
                    >
                      <span class="truncate flex-1">{item.label}</span>
                      <span class="badge badge-ghost badge-sm opacity-60 shrink-0"
                        >{getDatasetDuration(item.value)}</span
                      >
                    </button>
                  </li>
                {/each}
              {/if}
            {/each}
          </ul>
        </details>
      </div>

      <div class="divider my-2"></div>

      <!-- Icon buttons -->
      <div class="flex flex-wrap gap-3 justify-center">
        <IconButton
          icon={MdRotateLeft}
          tooltip="Rotate Left"
          onclick={() => {
            p5Instance.floorPlan.setRotateLeft()
            p5Instance.loop()
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={MdRotateRight}
          tooltip="Rotate Right"
          onclick={() => {
            p5Instance.floorPlan.setRotateRight()
            p5Instance.loop()
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={currentConfig.preserveFloorplanAspectRatio ? MdAspectRatio : MdFitToPageOutline}
          tooltip={currentConfig.preserveFloorplanAspectRatio ? 'Stretch to Fill' : 'Preserve Aspect Ratio'}
          onclick={() => {
            handleConfigChange('preserveFloorplanAspectRatio', !currentConfig.preserveFloorplanAspectRatio)
            p5Instance?.loop()
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={Md3DRotation}
          tooltip="Toggle 2D/3D"
          onclick={() => {
            p5Instance.handle3D.update()
            is3DMode = p5Instance.handle3D.getIs3DMode()
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={isVideoShowing ? MdVideocam : MdVideocamOff}
          tooltip="Show/Hide Video"
          onclick={() => {
            toggleVideo()
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={MdFileUploadOutline}
          tooltip="Import Files"
          onclick={() => {
            showImportDialog = true
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={MdHelpOutline}
          tooltip="Help"
          onclick={() => {
            $isModalOpen = !$isModalOpen
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={MdCloudDownload}
          tooltip="Download Codes"
          onclick={() => {
            p5Instance.saveCodeFile()
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={MdKeyboard}
          tooltip="Keyboard Shortcuts"
          onclick={() => {
            window.dispatchEvent(new CustomEvent('igs:open-cheatsheet'))
            mobileMenuOpen = false
          }}
        />
        <IconButton
          icon={MdSettings}
          tooltip="Settings"
          onclick={() => {
            showSettings = true
            mobileMenuOpen = false
          }}
        />
      </div>
    </div>
  {/if}
</div>

<div
  id="main-content"
  class:split-screen-mode={isSplitScreen}
  class:is-dragging-split={isDraggingSplit}
>
  {#if isSplitScreen}
    <div class="split-video-pane" style="width: {splitWidth}%;">
      <SplitScreenVideo />
    </div>
    <div
      class="split-divider"
      onmousedown={handleSplitDividerMouseDown}
      role="separator"
      tabindex="0"
    >
      <div class="divider-handle"></div>
    </div>
  {/if}
  <div
    id="p5-canvas-container"
    class="canvas-pane"
    class:cursor-crosshair={currentConfig.highlightToggle}
  >
    <P5 {sketch} />
    {#if !isSplitScreen}
      <VideoContainer />
    {/if}
    <ConversationTooltip hideTooltip={isTranscriptVisible} />
  </div>
</div>

<TranscriptPanel bind:isVisible={isTranscriptVisible} />

{#if showSettings}
  <div
    class="modal modal-open"
    onclick={(e) => {
      if (e.target === e.currentTarget) showSettings = false
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') showSettings = false
    }}
  >
    <div class="modal-box w-11/12 max-w-md">
      <div class="flex justify-between mb-4">
        <h3 class="font-bold text-lg">Settings</h3>
        <button class="btn btn-circle btn-sm" onclick={() => (showSettings = false)}>
          <MdClose class="h-5 w-5" />
        </button>
      </div>

      <div class="flex flex-col space-y-4">
        <!-- Animation Rate -->
        <div class="flex flex-col">
          <label for="animationRate" class="font-medium"
            >Animation Rate: {currentConfig.animationRate}</label
          >
          <input
            id="animationRate"
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            bind:value={currentConfig.animationRate}
            oninput={(e) => handleConfigChange('animationRate', parseFloat(e.target.value))}
            class="range range-primary"
          />
        </div>

        <!-- Sampling Interval -->
        <div class="flex flex-col">
          <label for="samplingInterval" class="font-medium"
            >Sampling Interval: {currentConfig.samplingInterval} sec</label
          >
          <input
            id="samplingInterval"
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            bind:value={currentConfig.samplingInterval}
            oninput={(e) => handleConfigChange('samplingInterval', parseFloat(e.target.value))}
            class="range range-primary"
          />
        </div>

        <!-- Small Data Threshold -->
        <div class="flex flex-col">
          <label for="smallDataThreshold" class="font-medium"
            >Small Data Threshold: {currentConfig.smallDataThreshold}</label
          >
          <input
            id="smallDataThreshold"
            type="range"
            min="500"
            max="10000"
            step="100"
            bind:value={currentConfig.smallDataThreshold}
            oninput={(e) => handleConfigChange('smallDataThreshold', parseInt(e.target.value))}
            class="range range-primary"
          />
        </div>

        <!-- Movement StrokeWeight -->
        <div class="flex flex-col">
          <label for="movementStrokeWeight" class="font-medium"
            >Movement Line Weight: {currentConfig.movementStrokeWeight}</label
          >
          <input
            id="movementStrokeWeight"
            type="range"
            min="1"
            max="20"
            step="1"
            bind:value={currentConfig.movementStrokeWeight}
            oninput={(e) => handleConfigChange('movementStrokeWeight', parseInt(e.target.value))}
            class="range range-primary"
          />
        </div>

        <!-- Stop StrokeWeight -->
        <div class="flex flex-col">
          <label for="stopStrokeWeight" class="font-medium"
            >Stop Line Weight: {currentConfig.stopStrokeWeight}</label
          >
          <input
            id="stopStrokeWeight"
            type="range"
            min="1"
            max="20"
            step="1"
            bind:value={currentConfig.stopStrokeWeight}
            oninput={(e) => handleConfigChange('stopStrokeWeight', parseInt(e.target.value))}
            class="range range-primary"
          />
        </div>

        <!-- Text Input for Seconds (Numeric Only) -->
        <div class="flex flex-col">
          <label for="inputSeconds" class="font-medium">End Time (seconds)</label>
          <input
            id="inputSeconds"
            type="text"
            bind:value={timelineEndTime}
            oninput={(e) => {
              let value = parseInt(e.target.value.replace(/\D/g, '')) || 0
              timelineV2Store.initialize(value, 0)
            }}
            class="input input-bordered"
          />
        </div>
      </div>

      <div class="flex flex-col mt-4">
        <button class="btn btn-sm ml-4" onclick={() => (showDataPopup = true)}>Data Explorer</button
        >
      </div>

      <div class="modal-action">
        <button class="btn btn-warning" onclick={resetSettings}> Reset Settings </button>
        <button class="btn" onclick={() => (showSettings = false)}>Close</button>
      </div>
    </div>
  </div>
{/if}

{#if showDataPopup}
  <div
    class="modal modal-open"
    onclick={(e) => {
      if (e.target === e.currentTarget) showDataPopup = false
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') showDataPopup = false
    }}
  >
    <div class="modal-box w-11/12 max-w-5xl">
      <div class="flex justify-between">
        <div class="flex flex-col">
          <h3 class="font-bold text-lg">Data Explorer</h3>
          <p>Here you will find detailed information on the data that you have uploaded.</p>
        </div>

        <button class="btn btn-circle btn-sm" onclick={() => (showDataPopup = false)}>
          <MdClose class="h-5 w-5" />
        </button>
      </div>

      <div class="overflow-x-auto">
        <div class="flex flex-col">
          <div class="flex-col my-4">
            <h4 class="font-bold my-2">Codes:</h4>
            <div class="grid grid-cols-5 gap-4">
              {#each $CodeStore as code}
                <div class="badge badge-neutral">{code.code}</div>
              {/each}
            </div>
          </div>

          <h4 class="font-bold">Users:</h4>
          {#each $UserStore as user}
            <div class="my-4">
              <div
                tabindex="0"
                class="text-primary-content bg-[#e6e4df] collapse"
                aria-controls="collapse-content-{user.name}"
                role="button"
              >
                <input type="checkbox" class="peer" />
                <div class="collapse-title font-semibold">{capitalizeEachWord(user.name)}</div>

                <div class="collapse-content">
                  <div class="flex flex-col">
                    <div class="flex">
                      <h2 class="font-medium">Color:</h2>
                      <div class="badge ml-2">{user.color}</div>
                    </div>
                    <div class="flex">
                      <h2 class="font-medium">Enabled</h2>
                      {#if user.enabled}
                        <div class="badge badge-success ml-2">{user.enabled}</div>
                      {:else}
                        <div class="badge badge-error ml-2">{user.enabled}</div>
                      {/if}
                    </div>
                  </div>
                  <h2 class="font-medium">Data Points:</h2>
                  <DataPointTable dataPoints={user.dataTrail} />
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
      <div class="modal-action">
        <button class="btn" onclick={() => (showDataPopup = false)}>Close</button>
      </div>
    </div>
  </div>
{/if}

<div
  class="btm-nav fixed bottom-0 left-0 right-0 flex justify-between min-h-24 z-50 p-0"
>
  <div
    class="flex flex-1 min-w-0 flex-row justify-start items-center bg-[#f6f5f3] px-4 lg:px-8 overflow-x-auto"
    onwheel={(e) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        e.currentTarget.scrollLeft += e.deltaY
      }
    }}
  >
    {#if $ConfigStore.dataHasCodes}
      <div class="relative mr-2">
        <button
          class="btn"
          onclick={(event) => {
            // Stop event propagation to prevent the global click handler from closing the dropdown
            event.stopPropagation()

            // Toggle the dropdown
            toggleDropdown('dropdown-codes', 'btn-codes')
          }}
          id="btn-codes"
        >
          CODES
        </button>

        <div id="dropdown-container-codes">
          <div
            id="dropdown-codes"
            class="hidden bg-base-100 rounded-box p-2 shadow absolute"
            style="z-index: 9999;"
          >
            <ul class="menu w-64 max-h-[75vh] overflow-y-auto flex-nowrap">
              <li>
                <div class="flex items-center">
                  <input
                    id="enableAllCodes"
                    type="checkbox"
                    class="checkbox"
                    checked={$CodeStore.every((code) => code.enabled)}
                    onchange={toggleSelectAllCodes}
                  />
                  Enable All
                </div>
                <div class="flex items-center">
                  <input
                    id="colorByCodes"
                    type="checkbox"
                    class="checkbox"
                    checked={$ConfigStore.isPathColorMode}
                    onchange={() => {
                      toggleColorMode()
                      p5Instance?.loop()
                    }}
                  />
                  Color by Codes
                </div>
                <div class="divider" />
              </li>
              {#each sortedCodes as code, index}
                <li><h3 class="pointer-events-none">{code.code.toUpperCase()}</h3></li>
                <li>
                  <div class="flex items-center">
                    <input
                      id="codeCheckbox-{code.code}"
                      type="checkbox"
                      class="checkbox"
                      checked={code.enabled}
                      onchange={(e) => {
                        setCodeEnabled(code.code, e.target.checked)
                        p5Instance?.loop()
                      }}
                    />
                    Enabled
                  </div>
                </li>
                <li>
                  <div class="flex items-center">
                    <input
                      type="color"
                      class="color-picker max-w-[24px] max-h-[28px]"
                      value={code.color}
                      onchange={(e) => {
                        setCodeColor(code.code, e.target.value)
                        p5Instance?.loop()
                      }}
                    />
                    Color
                  </div>
                </li>
                {#if index !== sortedCodes.length - 1}
                  <div class="divider" />
                {/if}
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <!-- User Buttons with Eye Icon -->
    {#each $UserStore as user}
      {@const visible = isUserVisible(user)}
      {@const buttonStyle = `color: ${visible ? user.color : '#999'}; opacity: ${visible ? 1 : 0.5};`}
      <div class="relative flex-shrink-0 mr-2">
        <div class="join">
          <!-- Visibility toggle (eye icon) -->
          <button
            class="btn join-item px-2"
            style={buttonStyle}
            onclick={(event) => {
              event.stopPropagation()
              toggleUserVisibility(user)
            }}
            title={visible ? 'Hide user' : 'Show user'}
          >
            {#if visible}
              <MdVisibility class="w-5 h-5" />
            {:else}
              <MdVisibilityOff class="w-5 h-5" />
            {/if}
          </button>

          <!-- Name button opens dropdown -->
          <button
            class="btn join-item px-3 max-w-40 truncate"
            style={buttonStyle}
            onclick={(event) => {
              event.stopPropagation()
              toggleDropdown(`dropdown-${user.name}`, `btn-${user.name}`)
            }}
            id={`btn-${user.name}`}
            title={user.name}
          >
            {user.name}
          </button>
        </div>

        <!-- User dropdown -->
        <div
          id={`dropdown-${user.name}`}
          class="hidden bg-base-100 rounded-box p-2 shadow absolute"
          style="z-index: 9999;"
        >
          <ul class="w-52">
            <!-- Name Input -->
            <li class="py-2">
              <input
                type="text"
                class="input input-bordered input-sm w-full"
                value={user.name}
                onchange={(e) => {
                  const oldName = user.name
                  const newName = e.currentTarget.value.trim()
                  if (newName && newName !== oldName) {
                    UserStore.update((users) =>
                      users.map((u) => (u.name === oldName ? { ...u, name: newName } : u))
                    )
                    closeAllDropdowns()
                    p5Instance?.loop()
                  }
                }}
                placeholder="User name"
              />
            </li>
            <!-- Movement -->
            <li class="py-2">
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox mr-2"
                  checked={user.enabled}
                  onchange={() => {
                    toggleUserEnabled(user.name)
                    p5Instance?.loop()
                  }}
                />
                Movement
              </label>
            </li>
            <!-- Talk -->
            <li class="py-2">
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  class="checkbox mr-2"
                  checked={user.conversation_enabled}
                  onchange={() => {
                    toggleUserConversationEnabled(user.name)
                    p5Instance?.loop()
                  }}
                />
                Talk
              </label>
            </li>
            <!-- Color -->
            <li class="py-2">
              <div class="flex items-center">
                <input
                  type="color"
                  class="color-picker max-w-[24px] max-h-[28px] mr-2"
                  value={user.color}
                  onchange={(e) => {
                    setUserColor(user.name, e.currentTarget.value)
                    p5Instance?.loop()
                  }}
                />
                <span>Color</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    {/each}
  </div>

  <!-- Right Side: Timeline -->
  <div
    class="flex flex-1 items-center bg-[#f6f5f3] overflow-visible py-1 px-2 lg:px-4"
    style="min-width: 280px;"
  >
    <TimelineContainer height={50} showControls={true} embedded={true} />
  </div>
</div>

<IgsInfoModal {isModalOpen} />

<OnboardingTour />

<ModeIndicator />

<DataImporter
  isOpen={showImportDialog}
  onClose={() => (showImportDialog = false)}
  onImport={handleImportFiles}
/>

<style>
  #main-content {
    position: relative;
    width: 100%;
  }

  #main-content.split-screen-mode {
    display: flex;
    height: calc(100vh - 4rem - 6rem); /* viewport - navbar - bottom nav */
    overflow: hidden;
  }

  .split-video-pane {
    min-width: 200px;
    max-width: 80%;
    height: 100%;
    flex-shrink: 0;
    background: #000;
  }

  .split-divider {
    width: 12px;
    background: #d1d5db;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .split-divider:hover {
    background: #3b82f6;
  }

  .split-divider:hover .divider-handle {
    background: white;
  }

  .divider-handle {
    width: 4px;
    height: 48px;
    background: #9ca3af;
    border-radius: 2px;
    transition: background 0.15s;
  }

  .canvas-pane {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  #main-content.split-screen-mode .canvas-pane {
    height: 100%;
    overflow: hidden;
  }

  /* Constrain the P5 canvas and its wrapper to fit within the container */
  #main-content.split-screen-mode #p5-canvas-container {
    width: 100%;
    overflow: hidden;
  }

  #main-content.split-screen-mode #p5-canvas-container :global(div:not(.timeline-tooltip):not(.tooltip-wrapper):not(.tooltip-content):not(.triangle)) {
    width: 100% !important;
    overflow: hidden;
  }

  #main-content.split-screen-mode #p5-canvas-container :global(canvas) {
    max-width: 100% !important;
    display: block;
  }

  /* Disable pointer events on children during drag to prevent P5 from capturing mouse */
  #main-content.is-dragging-split .canvas-pane,
  #main-content.is-dragging-split .split-video-pane {
    pointer-events: none;
  }

  #main-content.is-dragging-split .split-divider {
    background: #3b82f6;
  }

  .color-picker {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }
</style>
