<script lang="ts">
  import P5, { type Sketch } from 'p5-svelte'

  import type p5 from 'p5'
  import MdHelpOutline from '~icons/mdi/help-circle-outline'
  import MdKeyboard from '~icons/mdi/keyboard'
  import MdCloudUpload from '~icons/mdi/cloud-upload'
  import MdCloudDownload from '~icons/mdi/cloud-download'
  import MdRotateLeft from '~icons/mdi/rotate-left'
  import MdRotateRight from '~icons/mdi/rotate-right'
  import Md3DRotation from '~icons/mdi/rotate-3d-variant'
  import MdVideocam from '~icons/mdi/video'
  import MdVideocamOff from '~icons/mdi/video-off'
  import MdCheck from '~icons/mdi/check'
  import MdSettings from '~icons/mdi/cog'
  import MdFileUploadOutline from '~icons/mdi/file-upload-outline'

  import type { User } from '../models/user'

  import UserStore from '../stores/userStore'
  import P5Store from '../stores/p5Store'
  import VideoStore from '../stores/videoStore'

  import { Core } from '$lib'
  import { igsSketch } from '$lib/p5/igsSketch'
  import { writable } from 'svelte/store'
  import { onMount } from 'svelte'
  import IconButton from '$lib/components/IconButton.svelte'
  import IgsInfoModal from '$lib/components/IGSInfoModal.svelte'
  import TimelinePanel from '$lib/components/TimelinePanel.svelte'
  import DataPointTable from '$lib/components/DataPointTable.svelte'
  import ModeIndicator from '$lib/components/ModeIndicator.svelte'
  import { OnboardingTour } from '$lib/tour'
  import DataImportWizard from '$lib/components/wizard/DataImportWizard.svelte'

  import CodeStore from '../stores/codeStore'
  import ConfigStore from '../stores/configStore'
  import type { ConfigStoreType } from '../stores/configStore'
  import TimelineStore from '../stores/timelineStore'
  import { initialConfig } from '../stores/configStore'
  import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom'

  // Define ToggleKey type to fix TypeScript errors
  type ToggleKey = string

  // Floating UI references
  type FloatingElement = {
    button: HTMLElement | null
    content: HTMLElement | null
    cleanup: (() => void) | null
    isOpen: boolean
  }

  // Store references to floating elements
  const floatingElements: Record<string, FloatingElement> = {}

  // Function to position a floating element
  function positionFloatingElement(reference: HTMLElement, floating: HTMLElement) {
    return computePosition(reference, floating, {
      placement: 'top',
      middleware: [offset(6), flip(), shift({ padding: 5 })],
    }).then(({ x, y }) => {
      Object.assign(floating.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute',
        width: 'max-content',
        zIndex: '100',
      })
    })
  }

  // Function to toggle a floating element
  function toggleFloating(id: string) {
    const element = floatingElements[id]
    if (!element || !element.button || !element.content) return

    element.isOpen = !element.isOpen

    if (element.isOpen) {
      // Show the floating element
      element.content.style.display = 'block'
      document.body.appendChild(element.content)

      // Position it initially
      positionFloatingElement(element.button, element.content)

      // Set up auto-update to reposition on scroll/resize
      element.cleanup = autoUpdate(element.button, element.content, () =>
        positionFloatingElement(element.button, element.content)
      )

      // Add click outside listener
      const handleClickOutside = (event: MouseEvent) => {
        if (
          element.content &&
          element.button &&
          !element.content.contains(event.target as Node) &&
          !element.button.contains(event.target as Node)
        ) {
          toggleFloating(id)
        }
      }

      document.addEventListener('click', handleClickOutside)

      // Update cleanup to include removing the event listener
      const prevCleanup = element.cleanup
      element.cleanup = () => {
        prevCleanup?.()
        document.removeEventListener('click', handleClickOutside)
      }
    } else {
      // Hide the floating element
      if (element.content) {
        element.content.style.display = 'none'
      }

      // Clean up auto-update
      if (element.cleanup) {
        element.cleanup()
        element.cleanup = null
      }
    }
  }

  // Function to register a floating element
  function registerFloating(id: string, button: HTMLElement, content: HTMLElement) {
    floatingElements[id] = {
      button,
      content,
      cleanup: null,
      isOpen: false,
    }

    // Initially hide the content
    content.style.display = 'none'
  }

  const filterToggleOptions = ['movementToggle', 'stopsToggle'] as const
  const selectToggleOptions = ['circleToggle', 'sliceToggle', 'highlightToggle'] as const
  const conversationToggleOptions = ['alignToggle'] as const
  let selectedDropDownOption = $state('')
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

  let showDataPopup = $state(false)
  let showSettings = $state(false)
  let showDataDropDown = $state(false)
  let showImportWizard = $state(false)
  let currentConfig = $state<ConfigStoreType>($ConfigStore)

  let files = $state<any>([])
  let users = $state<User[]>([])
  let p5Instance = $state<p5 | null>(null)
  let core: Core
  let isVideoShowing = $state(false)
  let isVideoPlaying = $state(false)
  let timeline = $state($TimelineStore)

  $effect(() => {
    currentConfig = $ConfigStore
  })

  $effect(() => {
    timeline = $TimelineStore
  })

  $effect(() => {
    const videoState = $VideoStore
    isVideoShowing = videoState.isShowing
    isVideoPlaying = videoState.isPlaying
  })

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
    if (p5Instance && p5Instance.videoController) {
      p5Instance.videoController.toggleShowVideo()
      VideoStore.update((value) => {
        value.isShowing = p5Instance.videoController.isShowing
        value.isPlaying = p5Instance.videoController.isPlaying
        return value
      })
    }
  }

  function resetSettings() {
    ConfigStore.update(() => ({ ...initialConfig }))

    if (p5Instance) {
      p5Instance.loop()
    }
  }

  function capitalizeEachWord(sentence: string) {
    return sentence
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // TODO: Sync this with the capitalizeEachWord function
  function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
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
      p5Instance?.loop()
      return updatedStore
    })
    p5Instance?.loop()
  }

  function toggleSelectAllCodes() {
    const allEnabled = $CodeStore.every((code) => code.enabled)
    CodeStore.update((codes) => codes.map((code) => ({ ...code, enabled: !allEnabled })))
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

  function updateUserLoadedFiles(event) {
    core.handleUserLoadedFiles(event)
    p5Instance.loop()
  }

  function handleWizardImport(files: File[], clearExisting: boolean) {
    // Clear existing data if requested
    if (clearExisting) {
      clearAllData()
    }

    // Process each file using the existing core file handler
    files.forEach((file) => {
      core.testFileTypeForProcessing(file)
    })

    // Trigger redraw
    p5Instance?.loop()
  }

  function updateExampleDataDropDown(event) {
    clearAllData()
    core.handleExampleDropdown(event)
    p5Instance.loop()
  }

  function clearAllData() {
    console.log('Clearing all data')
    p5Instance.videoController.clear()
    currentConfig.isPathColorMode = false

    // Close all floating elements before clearing data
    Object.keys(floatingElements).forEach((id) => {
      if (floatingElements[id].isOpen) {
        toggleFloating(id)
      }
    })

    // Clear all floating elements
    Object.keys(floatingElements).forEach((id) => {
      const element = floatingElements[id]
      if (element.cleanup) {
        element.cleanup()
      }
      if (element.content && element.content.parentNode) {
        element.content.parentNode.removeChild(element.content)
      }
      delete floatingElements[id]
    })

    closeAllDropdowns()

    UserStore.update(() => {
      return []
    })

    CodeStore.update(() => {
      return []
    })

    core.codeData = []
    core.movementData = []
    core.conversationData = []

    ConfigStore.update((currentConfig) => ({ ...currentConfig, dataHasCodes: false }))
    p5Instance.loop()
  }

  function clearMovementData() {
    UserStore.update(() => [])
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
    CodeStore.update(() => {
      return []
    })
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

  function handleWordSearch(event) {
    const newWord = event.target.value.trim()
    ConfigStore.update((config) => ({ ...config, wordToSearch: newWord }))
    // Trigger a redraw of the P5 sketch
    if (p5Instance) {
      p5Instance.loop()
    }
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

<svelte:head>
  <title>IGS</title>
</svelte:head>

<div class="navbar min-h-16 bg-[#ffffff]">
  <div class="flex-1 px-2 lg:flex-none">
    <a class="text-2xl font-bold text-black italic" href="https://interactiongeography.org">IGS</a>
  </div>

  <div class="flex items-center justify-end flex-1 px-2">
    <details class="dropdown" use:clickOutside>
      <summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center">
        Filter
      </summary>
      <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
        {#each filterToggleOptions as toggle}
          <li>
            <button
              onclick={() => toggleSelection(toggle, filterToggleOptions)}
              class="w-full text-left flex items-center"
            >
              <div class="w-4 h-4 mr-2">
                {#if $ConfigStore[toggle]}
                  <MdCheck />
                {/if}
              </div>
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

    <!-- Select Dropdown -->
    <details class="dropdown" use:clickOutside>
      <summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center">
        Select
      </summary>
      <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
        {#each selectToggleOptions as toggle}
          <li>
            <button
              onclick={() => toggleSelection(toggle, selectToggleOptions)}
              class="w-full text-left flex items-center"
            >
              <div class="w-4 h-4 mr-2">
                {#if $ConfigStore[toggle]}
                  <MdCheck />
                {/if}
              </div>
              {capitalizeFirstLetter(toggle.replace('Toggle', ''))}
            </button>
          </li>
        {/each}
      </ul>
    </details>

    <!-- Talk Dropdown -->
    <details class="dropdown" use:clickOutside>
      <summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center">
        Talk
      </summary>
      <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
        {#each conversationToggleOptions as toggle}
          <li>
            <button
              onclick={() => toggleSelection(toggle, conversationToggleOptions)}
              class="w-full text-left flex items-center"
            >
              <div class="w-4 h-4 mr-2">
                {#if $ConfigStore[toggle]}
                  <MdCheck />
                {/if}
              </div>
              {capitalizeFirstLetter(toggle.replace('Toggle', ''))}
            </button>
          </li>
        {/each}
        <li class="cursor-none">
          <p>Rect width: {$ConfigStore.conversationRectWidth} pixels</p>
        </li>
        <li>
          <label for="rectWidthRange" class="sr-only">Adjust rect width</label>
          <input
            id="rectWidthRange"
            type="range"
            min="1"
            max="30"
            value={$ConfigStore.conversationRectWidth}
            class="range"
            oninput={(e) => handleConfigChangeFromInput(e, 'conversationRectWidth')}
          />
        </li>
        <input
          type="text"
          placeholder="Search conversations..."
          oninput={(e) => handleWordSearch(e)}
          class="input input-bordered w-full"
        />
      </ul>
    </details>

    <!-- Clear Data Dropdown -->
    <details class="dropdown" use:clickOutside>
      <summary class="btn btn-sm ml-4 tooltip tooltip-bottom flex items-center justify-center">
        Clear
      </summary>
      <ul class="menu dropdown-content rounded-box z-[1] w-52 p-2 shadow bg-base-100">
        <li><button onclick={clearMovementData}>Movement</button></li>
        <li><button onclick={clearConversationData}>Conversation</button></li>
        <li><button onclick={clearCodeData}>Codes</button></li>
        <li><button onclick={() => p5Instance.videoController.clear()}>Video</button></li>
        <li><button onclick={clearAllData}>All Data</button></li>
      </ul>
    </details>

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
        id="btn-toggle-3d"
        icon={Md3DRotation}
        tooltip={'Toggle 2D/3D'}
        onclick={() => {
          p5Instance.handle3D.update()
        }}
      />
      {#if isVideoShowing}
        <IconButton
          id="btn-toggle-video"
          icon={MdVideocam}
          tooltip={'Show/Hide Video'}
          onclick={toggleVideo}
        />
      {:else}
        <IconButton
          id="btn-toggle-video"
          icon={MdVideocamOff}
          tooltip={'Show/Hide Video'}
          onclick={toggleVideo}
        />
      {/if}
      <IconButton
        icon={MdCloudDownload}
        tooltip={'Download Code File'}
        onclick={() => p5Instance.saveCodeFile()}
      />
      <IconButton
        icon={MdFileUploadOutline}
        tooltip={'Import Wizard'}
        onclick={() => (showImportWizard = true)}
      />
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
        onchange={updateUserLoadedFiles}
      />
      <IconButton
        icon={MdKeyboard}
        tooltip={'Keyboard Shortcuts (?)'}
        onclick={() => window.dispatchEvent(new CustomEvent('igs:open-cheatsheet'))}
      />
      <IconButton
        icon={MdHelpOutline}
        tooltip={'Help'}
        onclick={() => ($isModalOpen = !$isModalOpen)}
      />
      <IconButton icon={MdSettings} tooltip={'Settings'} onclick={() => (showSettings = true)} />

      <div class="relative inline-block text-left">
        <button
          onclick={() => (showDataDropDown = !showDataDropDown)}
          class="flex justify-between w-full rounded border border-gray-300 p-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-indigo-500"
        >
          {selectedDropDownOption || '-- Select an Example --'}
          <div
            class={`ml-2 transition-transform duration-300 ${showDataDropDown ? 'rotate-0' : 'rotate-180'}`}
          >
            <span class="block w-3 h-3 border-l border-t border-gray-700 transform rotate-45"
            ></span>
          </div>
        </button>

        {#if showDataDropDown}
          <div
            class="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg max-h-[75vh] overflow-y-auto"
          >
            <ul class="py-1" role="menu" aria-orientation="vertical">
              {#each dropdownOptions as group}
                <li class="px-4 py-2 font-semibold text-gray-600">{group.label}</li>
                {#each group.items as item}
                  <li>
                    <button
                      onclick={() => {
                        updateExampleDataDropDown({ target: { value: item.value } })
                        showDataDropDown = false
                        selectedDropDownOption = item.label
                      }}
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
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

<div class="h-10">
  <P5 {sketch} />
</div>

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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
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
            bind:value={timeline.endTime}
            oninput={(e) => {
              let value = parseInt(e.target.value.replace(/\D/g, '')) || 0
              TimelineStore.update((timeline) => {
                timeline.setCurrTime(0)
                timeline.setStartTime(0)
                timeline.setEndTime(value)
                timeline.setLeftMarker(0)
                timeline.setRightMarker(value)
                return timeline
              })
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
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
  class="btm-nav flex justify-between"
  style="position: fixed; bottom: 0; left: 0; right: 0; height: auto; min-height: 6rem; z-index: 50; padding: 0;"
>
  <div
    class="flex flex-1 flex-row justify-start items-center bg-[#f6f5f3] px-8 overflow-x-auto"
    style="min-height: inherit; align-self: stretch;"
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
                    onchange={() => {
                      toggleSelectAllCodes()
                      p5Instance?.loop()
                    }}
                  />
                  Enable All
                </div>
                <div class="flex items-center">
                  <input
                    id="colorByCodes"
                    type="checkbox"
                    class="checkbox"
                    bind:checked={$ConfigStore.isPathColorMode}
                    onchange={() => p5Instance?.loop()}
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
                      bind:checked={code.enabled}
                      onchange={() => p5Instance?.loop()}
                    />
                    Enabled
                  </div>
                </li>
                <li>
                  <div class="flex items-center">
                    <input
                      type="color"
                      class="color-picker max-w-[24px] max-h-[28px]"
                      bind:value={code.color}
                      onchange={() => p5Instance?.loop()}
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

    <!-- Users Dropdowns with Floating UI -->
    {#each $UserStore as user, index}
      <div class="relative mr-2">
        <button
          class="btn"
          style="color: {user.color};"
          onclick={(event) => {
            // Stop event propagation to prevent the global click handler from closing the dropdown
            event.stopPropagation()

            // Toggle the dropdown
            toggleDropdown(`dropdown-${user.name}`, `btn-${user.name}`)
          }}
          id={`btn-${user.name}`}
        >
          {user.name}
        </button>

        <div id={`dropdown-container-${user.name}`}>
          <div
            id={`dropdown-${user.name}`}
            class="hidden bg-base-100 rounded-box p-2 shadow absolute"
            style="z-index: 9999;"
          >
            <ul class="w-52">
              <li class="py-2">
                <div class="flex items-center">
                  <input
                    id="userCheckbox-{user.name}"
                    type="checkbox"
                    class="checkbox mr-2"
                    bind:checked={user.enabled}
                    onchange={() => p5Instance?.loop()}
                  />
                  <label for="userCheckbox-{user.name}">Movement</label>
                </div>
              </li>
              <li class="py-2">
                <div class="flex items-center">
                  <input
                    id="userTalkCheckbox-{user.name}"
                    type="checkbox"
                    class="checkbox mr-2"
                    bind:checked={user.conversation_enabled}
                    onchange={() => p5Instance?.loop()}
                  />
                  <label for="userTalkCheckbox-{user.name}">Talk</label>
                </div>
              </li>
              <li class="py-2">
                <div class="flex items-center">
                  <input
                    type="color"
                    class="color-picker max-w-[24px] max-h-[28px] mr-2"
                    bind:value={user.color}
                    onchange={() => p5Instance?.loop()}
                  />
                  <span>Color</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
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

<slot />

<IgsInfoModal {isModalOpen} />

<OnboardingTour />

<ModeIndicator />

<DataImportWizard
  isOpen={showImportWizard}
  onClose={() => (showImportWizard = false)}
  onImport={handleWizardImport}
/>

<style>
  .color-picker {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
  }
</style>
