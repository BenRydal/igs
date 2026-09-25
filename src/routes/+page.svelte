<script lang="ts">
  import {
    Sketch,
    CanvasFrame,
    SplitPane,
    ActivityBar,
    SidePanel,
    EntityToggleList,
    type Entity,
  } from 'svelte-p5-components'

  import type { IgsP5 } from '$lib/p5/igs-p5'
  import MdHelpOutline from '~icons/mdi/help-circle-outline'
  import MdKeyboard from '~icons/mdi/keyboard'
  import MdCloudDownload from '~icons/mdi/cloud-download'
  import MdRotateLeft from '~icons/mdi/rotate-left'
  import MdRotateRight from '~icons/mdi/rotate-right'
  import Md3DRotation from '~icons/mdi/rotate-3d-variant'
  import MdVideocam from '~icons/mdi/video'
  import MdVideocamOff from '~icons/mdi/video-off'
  import MdCheck from '~icons/mdi/check'
  import MdSettings from '~icons/mdi/cog'
  import MdFileUploadOutline from '~icons/mdi/file-upload-outline'
  import MdFilterList from '~icons/mdi/filter-variant'
  import MdSelectAll from '~icons/mdi/selection'
  import MdChat from '~icons/mdi/chat'
  import MdFolder from '~icons/mdi/folder-open'
  import MdSports from '~icons/mdi/basketball'
  import MdMuseum from '~icons/mdi/bank'
  import MdSchool from '~icons/mdi/school'
  import MdTeacher from '~icons/mdi/human-male-board'
  import MdWalk from '~icons/mdi/walk'
  import MdVideo from '~icons/mdi/video-vintage'
  import MdChevronDown from '~icons/mdi/chevron-down'
  import MdChevronRight from '~icons/mdi/chevron-right'
  import MdClose from '~icons/mdi/close'
  import MdFloorPlan from '~icons/mdi/floor-plan'
  import MdAccountGroup from '~icons/mdi/account-group'
  import MdTagMultiple from '~icons/mdi/tag-multiple'
  import MdTableEye from '~icons/mdi/table-eye'

  import type { User } from '../models/user'
  import UserStore from '../stores/userStore'
  import P5Store from '../stores/p5Store'
  import VideoStore, {
    toggleVisibility,
    reset as resetVideo,
    hasVideoSource,
  } from '../stores/videoStore'
  import GPSStore, { resetGPS } from '../stores/gpsStore'
  import { onVideoVisibilityChange, pause as pausePlayback } from '../stores/playbackStore'
  import VideoContainer from '$lib/components/VideoContainer.svelte'
  import SplitScreenVideo from '$lib/components/SplitScreenVideo.svelte'
  import TranscriptPanel from '$lib/components/TranscriptPanel.svelte'
  import ConversationTooltip from '$lib/components/ConversationTooltip.svelte'
  import SpaceTimeTooltip from '$lib/components/SpaceTimeTooltip.svelte'

  import { Core } from '$lib'
  import { EXAMPLE_DATASETS } from '$lib/core/example-datasets'
  import type { ExampleSelectEvent } from '$lib/core/types'
  import { igsSketch } from '$lib/p5/igsSketch'
  import { writable } from 'svelte/store'
  import { onMount, tick, flushSync, type Component, type Snippet } from 'svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import IconButton from '$lib/components/IconButton.svelte'
  import IgsInfoModal from '$lib/components/IGSInfoModal.svelte'
  import { TimelineContainer } from '$lib/timeline'
  import DataPointTable from '$lib/components/DataPointTable.svelte'
  import ModeIndicator from '$lib/components/ModeIndicator.svelte'
  import { OnboardingTour, shouldShowTour } from '$lib/tour'
  import DataImporter from '$lib/components/import/DataImporter.svelte'
  import MapStyleSelector from '$lib/components/MapStyleSelector.svelte'
  import CodesPanel from '$lib/components/CodesPanel.svelte'
  import TimelineControls from '$lib/timeline/components/TimelineControls.svelte'
  import { capitalizeFirstLetter, capitalizeEachWord } from '$lib/utils/string'
  import { loadAdvancedMode, saveAdvancedMode } from '$lib/utils/advanced-mode-storage'
  import { Z_INDEX } from '$lib/styles/z-index'
  import MondrianTool from '$lib/mondrian-tool/MondrianTool.svelte'
  import ToolSwitcher from '$lib/mondrian-bridge/ToolSwitcher.svelte'
  import { activeTool, toolFromParam, TOOL_PARAM, type Tool } from '$lib/mondrian-bridge/tool'
  import { syncMondrianIntoIgs, handIgsMediaToMondrian } from '$lib/mondrian-bridge/sync'
  import { page } from '$app/state'
  import { replaceState } from '$app/navigation'
  import { browser } from '$app/environment'

  import CodeStore from '../stores/codeStore'
  import ConfigStore from '../stores/configStore'
  import type { ConfigStoreType } from '../stores/configStore'
  import { timelineV2Store } from '$lib/timeline/store'
  import { initialConfig } from '../stores/configStore'
  import { setSelectorSize, setSlicerSize } from '$lib/history/config-actions'
  import {
    toggleUserVisibility as toggleUserVisibilityAction,
    toggleUserEnabled,
    toggleUserConversationEnabled,
    setUserName,
    createUserColorDrag,
  } from '$lib/history/user-actions'
  import {
    clearUsers,
    clearCodes,
    clearAllData as clearAllDataWithHistory,
  } from '$lib/history/data-actions'

  // Boolean config keys: what the toggle handlers may flip
  type ToggleKey = {
    [K in keyof ConfigStoreType]: ConfigStoreType[K] extends boolean ? K : never
  }[keyof ConfigStoreType]

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
        { value: 'example-3', label: '8th Grade Science Lesson' },
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
      label: 'TAU Project',
      icon: MdTeacher,
      items: [
        { value: 'example-10', label: 'Clark AP Math Lesson' },
        { value: 'example-17', label: 'Sandy Math Lesson (2022)' },
        { value: 'example-18', label: 'Sandy Math Lesson (2023)' },
        { value: 'example-19', label: 'Sofia Math Lesson' },
        { value: 'example-20', label: 'Vince Math Lesson' },
      ],
    },
    // Hidden temporarily - uncomment when ready to show
    // {
    //   label: 'Music Performance',
    //   icon: MdMusic,
    //   items: [
    //     { value: 'example-15', label: 'Trio' },
    //     { value: 'example-16', label: 'Full Band' },
    //   ],
    // },
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
  const expandedCategories = new SvelteSet(dropdownOptions.map((g) => g.label))

  function toggleCategory(label: string) {
    if (expandedCategories.has(label)) {
      expandedCategories.delete(label)
    } else {
      expandedCategories.add(label)
    }
  }

  let showDataPopup = $state(false)
  let showImportDialog = $state(false)
  /** Read-only view of the store. Sliders bind one-way and write via their
   *  `oninput` handlers — `bind:value` here would mutate the store's object in
   *  place, ahead of the handler, and break undo. */
  const currentConfig = $derived($ConfigStore)

  let p5Instance = $state<IgsP5 | null>(null)
  let core: Core
  let isVideoShowing = $state(false)
  let is3DMode = $state(true)
  let timelineEndTime = $state(0)
  let isTranscriptVisible = $state(true)
  let spaceTimeTooltip: SpaceTimeTooltip

  $effect(() => {
    const unsubscribe = timelineV2Store.subscribe((state) => {
      timelineEndTime = state.dataEnd
    })
    return unsubscribe
  })

  let isSplitScreen = $state(false)
  /** SplitPane sizes as percentages: [video, canvas] */
  let splitSizes = $state<[number, number]>([40, 60])
  /** SplitPane's `--split-divider-size`. */
  const SPLIT_DIVIDER_PX = 8
  /** Drives `pane-inert` and defers the sketch rebuild until the drag ends. */
  let isDraggingSplit = $state(false)
  /**
   * Bumping this remounts <Sketch> via {#key}, destroying and recreating the
   * WEBGL canvas. Used after clearing large datasets (Safari degrades when a
   * long-lived GL context accumulates big uploads). See svelte-p5's WEBGL
   * recipe: the old context is released explicitly before the remount.
   */
  let canvasEpoch = $state(0)

  $effect(() => {
    const videoState = $VideoStore
    isVideoShowing = videoState.isVisible
    isSplitScreen = videoState.isSplitScreen
  })

  $effect(() => {
    p5Instance = $P5Store
    if (p5Instance) {
      core = new Core(p5Instance)
    }
  })

  // From the URL on server and client alike, so SSR and hydration render the same tool.
  const landingTool = toolFromParam(page.url.searchParams.get(TOOL_PARAM))
  let tool = $state<Tool>(landingTool)
  if (browser) activeTool.set(landingTool)
  // Mondrian mounts on first use and then stays mounted, so its video and drawing survive switching.
  let mondrianMounted = $state(landingTool === 'mondrian')
  let mondrian = $state<MondrianTool>()

  async function switchTool(next: Tool) {
    if (next === tool) return
    if (next === 'igs' && mondrian && core) syncMondrianIntoIgs(core, mondrian)
    if (next === 'mondrian') pausePlayback()
    mondrianMounted = true
    tool = next
    activeTool.set(next)
    syncToolToUrl(next)
    if (next === 'igs') {
      p5Instance?.loop()
      return
    }
    await tick()
    requestAnimationFrame(() => mondrian && handIgsMediaToMondrian(p5Instance, mondrian))
  }

  function syncToolToUrl(next: Tool) {
    // page.url can lag behind a shallow replaceState; the address bar is the source of truth.
    const url = new URL(window.location.href)
    if (next === 'igs') url.searchParams.delete(TOOL_PARAM)
    else url.searchParams.set(TOOL_PARAM, next)
    replaceState(url, page.state)
  }

  // Modal state - opens immediately for first-time visitors
  let isModalOpen = writable(false)

  type RailTab = 'data' | 'people' | 'codes' | 'talk' | 'filters' | 'select' | 'view' | 'settings'
  const RAIL_LABELS: Record<RailTab | 'help', string> = {
    data: 'Data',
    people: 'People',
    codes: 'Codes',
    talk: 'Talk',
    filters: 'Filters',
    select: 'Select',
    view: 'View',
    settings: 'Settings',
    help: 'Help',
  }
  let activeTab = $state<RailTab | null>(null)
  // The panel keeps rendering this while it slides closed, so it never blanks mid-exit.
  let lastTab = $state<RailTab>('data')
  let panelWidth = $state(300)
  /** Rail plus open panel: how far the canvas is pushed right. */
  let railWidth = $state(0)
  /** Set when the tour opens a panel, so its highlight lands on the final layout. */
  let instantPanel = $state(false)

  function handleRailSelect(id: string) {
    if (id === 'help') {
      $isModalOpen = !$isModalOpen
      return
    }
    const tab = id as RailTab
    instantPanel = false
    activeTab = activeTab === tab ? null : tab
    if (activeTab) lastTab = activeTab
  }

  function isTabAvailable(tab: RailTab): boolean {
    if (tab === 'filters' || tab === 'view') return $ConfigStore.advancedMode
    if (tab === 'select') return $ConfigStore.advancedMode && !is3DMode
    if (tab === 'codes') return $ConfigStore.dataHasCodes
    return true
  }

  $effect(() => {
    if (activeTab && !isTabAvailable(activeTab)) activeTab = null
  })

  let formattedStopLength = $derived($ConfigStore.stopSliderValue.toFixed(0))

  function toggleVideo() {
    if (!hasVideoSource()) return

    const willBeVisible = !$VideoStore.isVisible
    toggleVisibility()
    onVideoVisibilityChange(willBeVisible)
  }

  function toggleAdvancedMode() {
    const newValue = !$ConfigStore.advancedMode

    // When switching to simple mode, reset advanced-only features
    // so user isn't stuck with hidden active modes
    if (!newValue) {
      ConfigStore.update((c) => ({
        ...c,
        advancedMode: false,
        circleToggle: false,
        sliceToggle: false,
        highlightToggle: false,
        movementToggle: false,
        stopsToggle: false,
      }))
      p5Instance?.loop()
    } else {
      ConfigStore.update((c) => ({ ...c, advancedMode: true }))
    }

    saveAdvancedMode(newValue)
  }

  function resetSettings() {
    // Preserve advancedMode (UI preference) when resetting visualization settings
    const preserveAdvancedMode = $ConfigStore.advancedMode
    ConfigStore.update(() => ({ ...initialConfig, advancedMode: preserveAdvancedMode }))
    p5Instance?.loop()
  }

  function handleConfigChangeFromInput(e: Event, key: keyof ConfigStoreType) {
    const target = e.target as HTMLInputElement
    ConfigStore.update((value) => ({ ...value, [key]: parseFloat(target.value) }))
    p5Instance?.loop() // Trigger redraw
  }

  function handleConfigChange(
    key: keyof ConfigStoreType,
    value: ConfigStoreType[keyof ConfigStoreType]
  ) {
    ConfigStore.update((store) => ({ ...store, [key]: value }))
    p5Instance?.loop()
  }

  function toggleSelection(selection: ToggleKey, toggleOptions: readonly ToggleKey[]) {
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
      await clearAllDataLocal()
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
    spaceTimeTooltip?.trigger()
  }

  async function updateExampleDataDropDown(event: ExampleSelectEvent) {
    await clearAllDataLocal()
    await core.handleExampleDropdown(event)
    p5Instance?.loop()
    spaceTimeTooltip?.trigger()
  }

  /** Resolves once the {#key}-remounted canvas has published a fresh instance. */
  function waitForCanvasRemount(prev: IgsP5 | null): Promise<IgsP5> {
    return new Promise((resolve) => {
      const unsub = P5Store.subscribe((inst) => {
        if (inst && inst !== prev) {
          queueMicrotask(() => unsub())
          resolve(inst)
        }
      })
    })
  }

  // Local version that handles UI cleanup and non-store data.
  // Async because the canvas remount it triggers is async: callers that load
  // data afterwards must await it so they talk to the fresh instance/Core.
  async function clearAllDataLocal() {
    resetVideo()

    // Use history-tracked function for store clearing
    clearAllDataWithHistory()

    core.codeData = []
    core.movementData = []
    core.conversationData = []
    resetGPS()
    core.gpsMovementData = []

    ConfigStore.update((config) => ({
      ...config,
      dataHasCodes: false,
      isPathColorMode: false,
      maxStopLength: 0,
    }))

    // Remount the canvas for a fresh WebGL context (helps Safari performance).
    // Release the old GL context explicitly first — browsers cap live contexts
    // and remove() alone leaves the release to GC.
    const prev = p5Instance
    ;(prev?.drawingContext as WebGL2RenderingContext | undefined)
      ?.getExtension('WEBGL_lose_context')
      ?.loseContext()
    canvasEpoch += 1
    await waitForCanvasRemount(prev)
    await tick() // let the P5Store $effect rebuild `core` for the new instance
  }

  function clearMovementData() {
    clearUsers()
    core.movementData = []
    core.gpsMovementData = []
    resetGPS()
    p5Instance?.loop()
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
    p5Instance?.loop()
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

    ConfigStore.update((currentConfig) => ({
      ...currentConfig,
      dataHasCodes: false,
      isPathColorMode: false,
    }))
    p5Instance?.loop()
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
    toggleUserVisibilityAction(user.name, isUserVisible(user))
    p5Instance?.loop()
  }

  const userEntities = $derived<Entity[]>(
    $UserStore.map((user) => ({
      id: user.name,
      label: user.name,
      color: user.color,
      visible: isUserVisible(user),
    }))
  )

  function findUser(id: string): User | undefined {
    return $UserStore.find((u) => u.name === id)
  }

  const userColorDrag = createUserColorDrag()

  function handleUserColorInput(id: string, color: string) {
    userColorDrag.input(id, color)
    p5Instance?.loop()
  }

  // Add event handlers for dropdowns
  onMount(() => {
    // Load advanced mode from localStorage
    const savedAdvancedMode = loadAdvancedMode()
    if (savedAdvancedMode) {
      ConfigStore.update((c) => ({ ...c, advancedMode: true }))
    }

    // Keyboard shortcut event handlers
    const handleToggle3D = () => {
      if (p5Instance?.handle3D) {
        p5Instance?.handle3D.update()
        is3DMode = p5Instance?.handle3D.getIs3DMode() ?? is3DMode
      }
    }

    const handleRotateFloorplan = (event: Event) => {
      const customEvent = event as CustomEvent<{ direction: 'left' | 'right' }>
      if (p5Instance?.floorPlan) {
        if (customEvent.detail.direction === 'left') {
          p5Instance?.floorPlan.setRotateLeft()
        } else {
          p5Instance?.floorPlan.setRotateRight()
        }
        p5Instance?.loop()
      }
    }

    const handleDownloadCodes = () => {
      if (p5Instance) {
        p5Instance?.saveCodeFile()
      }
    }

    const handleToggleHelp = () => {
      isModalOpen.update((value) => !value)
    }

    const handleLoadExample = (event: Event) => {
      const customEvent = event as CustomEvent<{ value: string }>
      if (customEvent.detail?.value) {
        updateExampleDataDropDown({ target: { value: customEvent.detail.value } })
        // Find and set the label for the dropdown
        for (const group of dropdownOptions) {
          const item = group.items.find((i) => i.value === customEvent.detail.value)
          if (item) {
            selectedDropDownOption = item.label
            break
          }
        }
      }
    }

    const handleOpenPanel = (event: Event) => {
      const tab = (event as CustomEvent<{ tab: RailTab | null }>).detail?.tab ?? null
      instantPanel = true
      activeTab = tab && isTabAvailable(tab) ? tab : null
      if (activeTab) lastTab = activeTab
      flushSync()
    }

    // Show welcome modal immediately for first-time visitors
    if (shouldShowTour() && landingTool === 'igs') {
      isModalOpen.set(true)
    }

    // Register event listeners
    window.addEventListener('igs:toggle-3d', handleToggle3D)
    window.addEventListener('igs:rotate-floorplan', handleRotateFloorplan)
    window.addEventListener('igs:download-codes', handleDownloadCodes)
    window.addEventListener('igs:toggle-help', handleToggleHelp)
    window.addEventListener('igs:load-example', handleLoadExample)
    window.addEventListener('igs:open-panel', handleOpenPanel)

    // Clear data event listeners (for command palette)
    window.addEventListener('igs:clear-movement', clearMovementData)
    window.addEventListener('igs:clear-conversation', clearConversationData)
    window.addEventListener('igs:clear-codes', clearCodeData)
    window.addEventListener('igs:clear-all', clearAllDataLocal)

    // Cleanup function
    return () => {
      // Remove keyboard shortcut handlers
      window.removeEventListener('igs:toggle-3d', handleToggle3D)
      window.removeEventListener('igs:rotate-floorplan', handleRotateFloorplan)
      window.removeEventListener('igs:download-codes', handleDownloadCodes)
      window.removeEventListener('igs:toggle-help', handleToggleHelp)
      window.removeEventListener('igs:load-example', handleLoadExample)
      window.removeEventListener('igs:open-panel', handleOpenPanel)

      // Remove clear data event listeners
      window.removeEventListener('igs:clear-movement', clearMovementData)
      window.removeEventListener('igs:clear-conversation', clearConversationData)
      window.removeEventListener('igs:clear-codes', clearCodeData)
      window.removeEventListener('igs:clear-all', clearAllDataLocal)
    }
  })
</script>

{#snippet icon(Icon: Component)}
  <div class="w-4 h-4"><Icon /></div>
{/snippet}

{#snippet check(condition: boolean)}
  <div class="w-4 h-4 mr-2">
    {#if condition}<MdCheck />{/if}
  </div>
{/snippet}

{#snippet toggleRow(label: string, on: boolean, onclick: () => void)}
  <li>
    <button {onclick} class="w-full text-left flex items-center" aria-pressed={on}>
      {@render check(on)}
      {label}
    </button>
  </li>
{/snippet}

{#snippet rangeRow(
  label: string,
  id: string,
  min: number,
  max: number,
  step: number,
  value: number,
  oninput: (e: Event & { currentTarget: HTMLInputElement }) => void
)}
  <div class="flex flex-col gap-1">
    <label for={id} class="text-xs">{label}</label>
    <input {id} type="range" {min} {max} {step} {value} class="range range-xs" {oninput} />
  </div>
{/snippet}

{#snippet panelSection(title: string, body: Snippet)}
  <section class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold uppercase tracking-wide opacity-60">{title}</h3>
    {@render body()}
  </section>
{/snippet}

{#snippet dataPanel()}
  <div class="flex flex-col gap-6 px-3 py-4">
    {#snippet importBody()}
      <button
        id="btn-import-files"
        class="btn btn-sm btn-primary gap-2"
        onclick={() => (showImportDialog = true)}
      >
        {@render icon(MdFileUploadOutline)}
        Import files
      </button>
    {/snippet}
    {@render panelSection('Your data', importBody)}

    {#snippet examplesBody()}
      <ul class="menu w-full p-0">
        {#each dropdownOptions as group (group.label)}
          <li>
            <button
              class="menu-title flex items-center gap-2 w-full hover:bg-base-200 rounded-lg px-2 py-1 cursor-pointer"
              onclick={() => toggleCategory(group.label)}
              aria-expanded={expandedCategories.has(group.label)}
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
            {#each group.items as item (item.value)}
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
    {/snippet}
    <div id="examples-list">{@render panelSection('Examples', examplesBody)}</div>

    {#if $ConfigStore.advancedMode}
      {#snippet clearBody()}
        <ul class="menu w-full p-0">
          <li><button onclick={clearMovementData}>Movement</button></li>
          <li><button onclick={clearConversationData}>Conversation</button></li>
          <li><button onclick={clearCodeData}>Codes</button></li>
          <li><button onclick={resetVideo}>Video</button></li>
          <li><button onclick={clearAllDataLocal} class="text-error">All data</button></li>
        </ul>
      {/snippet}
      {@render panelSection('Clear', clearBody)}
    {/if}
  </div>
{/snippet}

{#snippet userControls(entity: Entity)}
  {@const user = findUser(entity.id)}
  {#if user}
    <div class="flex items-center gap-1">
      <button
        class="btn btn-ghost btn-xs btn-square"
        class:opacity-40={!user.enabled}
        aria-pressed={user.enabled}
        aria-label="{user.enabled ? 'Hide' : 'Show'} movement for {user.name}"
        title="Movement"
        onclick={() => {
          toggleUserEnabled(user.name)
          p5Instance?.loop()
        }}
      >
        {@render icon(MdWalk)}
      </button>
      <button
        class="btn btn-ghost btn-xs btn-square"
        class:opacity-40={!user.conversation_enabled}
        aria-pressed={user.conversation_enabled}
        aria-label="{user.conversation_enabled ? 'Hide' : 'Show'} talk for {user.name}"
        title="Talk"
        onclick={() => {
          toggleUserConversationEnabled(user.name)
          p5Instance?.loop()
        }}
      >
        {@render icon(MdChat)}
      </button>
    </div>
  {/if}
{/snippet}

{#snippet peoplePanel()}
  <div class="flex flex-col gap-6 px-3 py-4">
    {#if userEntities.length === 0}
      <p class="text-sm opacity-70">Load an example or import data to see people here.</p>
    {:else}
      <p class="text-xs opacity-70">
        Click a name to show or hide everything for that person. The icons toggle movement and talk
        separately.
      </p>
      <EntityToggleList
        entities={userEntities}
        onToggle={(id) => {
          const user = findUser(id)
          if (user) toggleUserVisibility(user)
        }}
        onColorChange={handleUserColorInput}
        onRename={(id, next) => {
          setUserName(id, next)
          p5Instance?.loop()
        }}
        controls={userControls}
        class="igs-people"
      />
    {/if}
  </div>
{/snippet}

{#snippet talkPanel()}
  <div class="flex flex-col gap-6 px-3 py-4">
    {#snippet displayBody()}
      <ul class="menu w-full p-0">
        {@render toggleRow(
          'Transcript panel',
          isTranscriptVisible,
          () => (isTranscriptVisible = !isTranscriptVisible)
        )}
        {@render toggleRow('Show speech bubbles', $ConfigStore.showConversationRects, () =>
          handleConfigChange('showConversationRects', !$ConfigStore.showConversationRects)
        )}
        {@render toggleRow('Align to side', $ConfigStore.alignToggle, () =>
          toggleSelection('alignToggle', conversationToggleOptions)
        )}
      </ul>
    {/snippet}
    {@render panelSection('Display', displayBody)}

    {#if $ConfigStore.advancedMode}
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
    {/if}
  </div>
{/snippet}

{#snippet filtersPanel()}
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
{/snippet}

{#snippet selectPanel()}
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
{/snippet}

{#snippet viewPanel()}
  <div class="flex flex-col gap-6 px-3 py-4">
    {#snippet floorplanBody()}
      <div class="flex flex-wrap gap-2">
        <button
          id="btn-rotate-left"
          class="btn btn-sm gap-2"
          onclick={() => {
            p5Instance?.floorPlan.setRotateLeft()
            p5Instance?.loop()
          }}
        >
          {@render icon(MdRotateLeft)}
          Rotate left
        </button>
        <button
          id="btn-rotate-right"
          class="btn btn-sm gap-2"
          onclick={() => {
            p5Instance?.floorPlan.setRotateRight()
            p5Instance?.loop()
          }}
        >
          {@render icon(MdRotateRight)}
          Rotate right
        </button>
      </div>
      <ul class="menu w-full p-0">
        {@render toggleRow(
          'Preserve aspect ratio',
          currentConfig.preserveFloorplanAspectRatio,
          () =>
            handleConfigChange(
              'preserveFloorplanAspectRatio',
              !currentConfig.preserveFloorplanAspectRatio
            )
        )}
      </ul>
    {/snippet}
    {@render panelSection('Floor plan', floorplanBody)}

    {#if $GPSStore.isGPSMode}
      {#snippet mapBody()}
        <MapStyleSelector />
      {/snippet}
      {@render panelSection('Map style', mapBody)}
    {/if}
  </div>
{/snippet}

{#snippet settingsPanel()}
  <div class="flex flex-col gap-6 px-3 py-4">
    <label class="flex items-center justify-between gap-2 cursor-pointer">
      <span class="text-sm font-medium">Advanced mode</span>
      <input
        id="advanced-mode-toggle"
        type="checkbox"
        class="toggle toggle-primary toggle-sm"
        checked={$ConfigStore.advancedMode}
        onchange={toggleAdvancedMode}
      />
    </label>

    {#if $ConfigStore.advancedMode}
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
          `Sampling interval: ${currentConfig.samplingInterval} sec`,
          'samplingInterval',
          0.1,
          5,
          0.1,
          currentConfig.samplingInterval,
          (e) => handleConfigChange('samplingInterval', parseFloat(e.currentTarget.value))
        )}
        {@render rangeRow(
          `Small data threshold: ${currentConfig.smallDataThreshold}`,
          'smallDataThreshold',
          500,
          10000,
          100,
          currentConfig.smallDataThreshold,
          (e) => handleConfigChange('smallDataThreshold', parseInt(e.currentTarget.value))
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
            <button onclick={() => (showDataPopup = true)} class="flex items-center gap-2">
              {@render icon(MdTableEye)}
              Data explorer
            </button>
          </li>
          <li>
            <button onclick={() => p5Instance?.saveCodeFile()} class="flex items-center gap-2">
              {@render icon(MdCloudDownload)}
              Download codes
            </button>
          </li>
          <li>
            <button
              onclick={() => window.dispatchEvent(new CustomEvent('igs:open-cheatsheet'))}
              class="flex items-center gap-2"
            >
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
    {:else}
      <p class="text-sm opacity-70">
        Advanced mode adds filters, selection tools, floor plan controls and drawing settings.
      </p>
    {/if}
  </div>
{/snippet}

{#snippet dataIcon()}<MdFolder />{/snippet}
{#snippet peopleIcon()}<MdAccountGroup />{/snippet}
{#snippet codesIcon()}<MdTagMultiple />{/snippet}
{#snippet talkIcon()}<MdChat />{/snippet}
{#snippet filtersIcon()}<MdFilterList />{/snippet}
{#snippet selectIcon()}<MdSelectAll />{/snippet}
{#snippet viewIcon()}<MdFloorPlan />{/snippet}
{#snippet settingsIcon()}<MdSettings />{/snippet}
{#snippet helpIcon()}<MdHelpOutline />{/snippet}

<svelte:head>
  <title>IGS</title>
</svelte:head>

<div class="app-frame">
  <CanvasFrame>
    {#snippet top()}
      <div class="navbar min-h-16 bg-[#ffffff] relative">
        <div class="flex-1 min-w-0 px-2 flex items-center gap-4">
          <a class="text-2xl font-bold text-black italic" href="https://interactiongeography.org"
            >IGS</a
          >
          {#if selectedDropDownOption}
            <span class="truncate text-sm opacity-70" title={selectedDropDownOption}
              >{selectedDropDownOption}</span
            >
          {/if}
        </div>
        <div class="flex-none flex items-center gap-1 px-2">
          <IconButton
            id="btn-toggle-3d"
            icon={Md3DRotation}
            tooltip="Toggle 2D/3D"
            onclick={() => {
              p5Instance?.handle3D.update()
              is3DMode = p5Instance?.handle3D.getIs3DMode() ?? is3DMode
            }}
          />
          <IconButton
            id="btn-toggle-video"
            icon={isVideoShowing ? MdVideocam : MdVideocamOff}
            tooltip="Show/Hide Video"
            onclick={toggleVideo}
          />
          <ToolSwitcher {tool} onchange={switchTool} />
        </div>
      </div>
    {/snippet}

    {#snippet leftRail()}
      <nav class="igs-left-rail" aria-label="Sidebar navigation" bind:clientWidth={railWidth}>
        <ActivityBar
          activeId={activeTab ?? undefined}
          onSelect={handleRailSelect}
          items={[
            { id: 'data', label: RAIL_LABELS.data, icon: dataIcon },
            { id: 'people', label: RAIL_LABELS.people, icon: peopleIcon },
            ...($ConfigStore.dataHasCodes
              ? [{ id: 'codes', label: RAIL_LABELS.codes, icon: codesIcon }]
              : []),
            { id: 'talk', label: RAIL_LABELS.talk, icon: talkIcon },
            ...($ConfigStore.advancedMode
              ? [{ id: 'filters', label: RAIL_LABELS.filters, icon: filtersIcon }]
              : []),
            ...($ConfigStore.advancedMode && !is3DMode
              ? [{ id: 'select', label: RAIL_LABELS.select, icon: selectIcon }]
              : []),
            ...($ConfigStore.advancedMode
              ? [{ id: 'view', label: RAIL_LABELS.view, icon: viewIcon }]
              : []),
            { id: 'settings', label: RAIL_LABELS.settings, icon: settingsIcon },
            { id: 'help', label: RAIL_LABELS.help, icon: helpIcon },
          ]}
        />
        <!-- SidePanel stays mounted; the shell animates its occupied width so the
             canvas container reflows smoothly instead of jumping. -->
        <div
          id="igs-side-panel"
          role="tabpanel"
          aria-label={`${RAIL_LABELS[lastTab]} panel`}
          class="igs-sidepanel-shell"
          class:igs-sidepanel-shell--open={activeTab !== null}
          class:igs-sidepanel-shell--instant={instantPanel}
          style:width={`${activeTab ? panelWidth : 0}px`}
          style:--igs-drawer-z={Z_INDEX.DRAWER}
          inert={activeTab === null}
        >
          <SidePanel
            open={true}
            title={RAIL_LABELS[lastTab]}
            bind:width={panelWidth}
            onClose={() => (activeTab = null)}
          >
            {#if lastTab === 'data'}
              {@render dataPanel()}
            {:else if lastTab === 'people'}
              {@render peoplePanel()}
            {:else if lastTab === 'codes'}
              <CodesPanel />
            {:else if lastTab === 'talk'}
              {@render talkPanel()}
            {:else if lastTab === 'filters'}
              {@render filtersPanel()}
            {:else if lastTab === 'select'}
              {@render selectPanel()}
            {:else if lastTab === 'view'}
              {@render viewPanel()}
            {:else if lastTab === 'settings'}
              {@render settingsPanel()}
            {/if}
          </SidePanel>
        </div>
      </nav>
    {/snippet}

    {#snippet canvas()}
      <SplitPane
        orientation="horizontal"
        bind:sizes={splitSizes}
        minSize={200}
        collapsed={!isSplitScreen}
        collapsedPanel="first"
        onresize={() => p5Instance?.loop()}
        ondragstart={() => (isDraggingSplit = true)}
        ondragend={() => {
          isDraggingSplit = false
          p5Instance?.rebuildAfterResize()
        }}
      >
        {#snippet first()}
          <!-- SplitPane collapses by width, not {#if}, so this guard is what
               keeps a second VideoPlayer from staying mounted and competing
               for every seek. -->
          <div class="split-video-pane" class:pane-inert={isDraggingSplit}>
            {#if isSplitScreen}
              <SplitScreenVideo />
            {/if}
          </div>
        {/snippet}
        {#snippet second()}
          <div
            id="p5-canvas-container"
            class:cursor-crosshair={currentConfig.highlightToggle}
            class:pane-inert={isDraggingSplit}
          >
            {#key canvasEpoch}
              <Sketch
                sketch={igsSketch}
                onResize={(p) => {
                  if (isDraggingSplit) p.loop()
                  else p.rebuildAfterResize()
                }}
              />
            {/key}
            {#if !isSplitScreen}
              <VideoContainer />
            {/if}
            <TranscriptPanel bind:isVisible={isTranscriptVisible} />
            <ConversationTooltip hideTooltip={isTranscriptVisible} />
            <SpaceTimeTooltip bind:this={spaceTimeTooltip} />
          </div>
        {/snippet}
      </SplitPane>
    {/snippet}

    {#snippet bottom()}
      <div class="btm-nav flex justify-between min-h-16 p-0">
        <!-- The bottom bar spans the window but the canvas sits right of the rail
             (and the video pane in split mode), so this width puts the timeline track
             at the canvas pane's midpoint. The sketch derives the floorplan /
             space-time boundary from `leftX - canvasLeft`; without this the
             floorplan collapses, then inverts past a ~50% split. -->
        <div
          id="timeline-controls"
          class="flex min-w-0 flex-row justify-end items-center bg-[#f6f5f3] px-2 overflow-x-auto"
          style={`flex: 0 1 calc(${railWidth}px + (100% - ${railWidth}px) * ${
            isSplitScreen ? 0.5 + splitSizes[0] / 200 : 0.5
          } + ${isSplitScreen ? SPLIT_DIVIDER_PX / 2 : 0}px)`}
          onwheel={(e) => {
            if (e.deltaY !== 0) {
              e.preventDefault()
              e.currentTarget.scrollLeft += e.deltaY
            }
          }}
        >
          <TimelineControls />
        </div>

        <!-- Right side: the track, which doubles as the 2D view's time axis -->
        <div
          id="timeline-panel"
          class="flex flex-1 items-center bg-[#f6f5f3] overflow-visible py-0.5 px-2 lg:px-4"
          style="min-width: 200px;"
        >
          <TimelineContainer height={52} showControls={false} embedded={true} />
        </div>
      </div>
    {/snippet}
  </CanvasFrame>
</div>

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
              {#each $CodeStore as code (code.code)}
                <div class="badge badge-neutral">{code.code}</div>
              {/each}
            </div>
          </div>

          <h4 class="font-bold">Users:</h4>
          {#each $UserStore as user (user.name)}
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

<IgsInfoModal {isModalOpen} />

{#snippet mondrianSwitcher()}
  <ToolSwitcher {tool} onchange={switchTool} />
{/snippet}

{#if mondrianMounted}
  <div
    class="mondrian-layer"
    class:mondrian-layer--hidden={tool !== 'mondrian'}
    style:z-index={Z_INDEX.DRAWER}
    inert={tool !== 'mondrian'}
  >
    <MondrianTool
      bind:this={mondrian}
      active={tool === 'mondrian'}
      toolSwitcher={mondrianSwitcher}
    />
  </div>
{/if}

<OnboardingTour />

<ModeIndicator />

<DataImporter
  isOpen={showImportDialog}
  onClose={() => (showImportDialog = false)}
  onImport={handleImportFiles}
/>

<style>
  /* CanvasFrame needs a bounded parent; it flexes the canvas stage between
     the navbar (top snippet) and the bottom bar (bottom snippet). */
  .app-frame {
    height: 100vh;
    /* dvh so the bottom bar isn't pushed under a mobile URL bar; nothing here
       scrolls, so it would be unreachable. */
    height: 100dvh;
  }

  .igs-left-rail {
    position: relative;
    display: flex;
    height: 100%;
    min-height: 0;
    border-right: 1px solid var(--color-base-300);
    --activity-bar-bg: var(--color-base-100);
    --activity-bar-border: var(--color-base-300);
    --activity-bar-fg: color-mix(in srgb, var(--color-base-content) 60%, transparent);
    --activity-bar-fg-hover: var(--color-base-content);
    --activity-bar-bg-hover: var(--color-base-200);
    --activity-bar-fg-active: var(--color-base-content);
    --activity-bar-bg-active: color-mix(in srgb, var(--color-primary) 15%, transparent);
    --activity-bar-accent: var(--color-primary);
    --activity-bar-focus: var(--color-primary);
    --side-panel-bg: var(--color-base-100);
    --side-panel-border: var(--color-base-300);
    --side-panel-title-fg: color-mix(in srgb, var(--color-base-content) 70%, transparent);
    --side-panel-close-fg: color-mix(in srgb, var(--color-base-content) 70%, transparent);
  }

  .igs-sidepanel-shell {
    display: flex;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    transition: width 180ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* Below lg the panel overlays the canvas instead of squeezing it. */
  @media (max-width: 1023px) {
    .igs-sidepanel-shell {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 100%;
      z-index: var(--igs-drawer-z);
    }
    .igs-sidepanel-shell--open {
      box-shadow: 4px 0 12px rgb(0 0 0 / 0.12);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .igs-sidepanel-shell {
      transition: none;
    }
  }

  .igs-sidepanel-shell--instant {
    transition: none;
  }

  :global(.igs-people .entity-toggle-list__item) {
    flex: 1 1 100%;
  }

  :global(.igs-people .entity-toggle-list__label) {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* Mondrian covers IGS rather than replacing it, so both keep their size and state. */
  .mondrian-layer {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--color-base-100);
  }

  .mondrian-layer--hidden {
    visibility: hidden;
    pointer-events: none;
  }

  .split-video-pane {
    width: 100%;
    height: 100%;
    background: #000;
  }

  #p5-canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  /* Stops the YouTube iframe swallowing the pointermove/pointerup SplitPane
     listens for on `document`. */
  .pane-inert {
    pointer-events: none;
  }

  /* SplitPane's panels sum to 100% with `flex-shrink: 0` and then add an 8px
     divider, clipping the canvas pane's right edge. Let them shrink. */
  .app-frame :global(.split-pane__panel) {
    flex-shrink: 1;
  }
</style>
