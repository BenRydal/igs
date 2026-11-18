<script lang="ts">
  import { Sketch, CanvasFrame, SplitPane, ActivityBar, SidePanel } from 'svelte-p5-components'

  import MdHelpOutline from '~icons/mdi/help-circle-outline'
  import Md3DRotation from '~icons/mdi/rotate-3d-variant'
  import MdRotateLeft from '~icons/mdi/rotate-left'
  import MdRotateRight from '~icons/mdi/rotate-right'
  import MdVideocam from '~icons/mdi/video'
  import MdVideocamOff from '~icons/mdi/video-off'
  import MdSettings from '~icons/mdi/cog'
  import MdFilterList from '~icons/mdi/filter-variant'
  import MdSelectAll from '~icons/mdi/selection'
  import MdChat from '~icons/mdi/chat'
  import MdComment from '~icons/mdi/comment'
  import MdCommentOff from '~icons/mdi/comment-off'
  import MdFolder from '~icons/mdi/folder-open'
  import MdClose from '~icons/mdi/close'
  import MdAccountGroup from '~icons/mdi/account-group'
  import MdTagMultiple from '~icons/mdi/tag-multiple'

  import UserStore from '../stores/userStore'
  import P5Store from '../stores/p5Store'
  import { redrawCanvas, rotateFloorplan } from '#lib/utils/p5.ts'
  import VideoStore, { toggleVisibility, hasVideoSource } from '../stores/videoStore'
  import { onVideoVisibilityChange } from '../stores/playbackStore'
  import VideoContainer from '#lib/components/VideoContainer.svelte'
  import SplitScreenVideo from '#lib/components/SplitScreenVideo.svelte'
  import TranscriptPanel from '#lib/components/TranscriptPanel.svelte'
  import ConversationTooltip from '#lib/components/ConversationTooltip.svelte'
  import SpaceTimeTooltip from '#lib/components/SpaceTimeTooltip.svelte'
  import AxesIndicator from '#lib/components/AxesIndicator.svelte'

  import { getExampleLabel } from '#lib/core/example-datasets.ts'
  import { igsSketch } from '#lib/p5/igsSketch.ts'
  import { onMount } from 'svelte'
  import IconButton from '#lib/components/IconButton.svelte'
  import IgsInfoModal from '#lib/components/IGSInfoModal.svelte'
  import { Timeline } from '#lib/timeline/index.ts'
  import DataPointTable from '#lib/components/DataPointTable.svelte'
  import ModeIndicator from '#lib/components/ModeIndicator.svelte'
  import { OnboardingTour, shouldShowTour } from '#lib/tour/index.ts'
  import DataImporter from '#lib/components/import/DataImporter.svelte'
  import CodesPanel from '#lib/components/CodesPanel.svelte'
  import DataPanel from '#lib/components/panels/DataPanel.svelte'
  import PeoplePanel from '#lib/components/panels/PeoplePanel.svelte'
  import TalkPanel from '#lib/components/panels/TalkPanel.svelte'
  import FiltersPanel from '#lib/components/panels/FiltersPanel.svelte'
  import SelectPanel from '#lib/components/panels/SelectPanel.svelte'
  import SettingsPanel from '#lib/components/panels/SettingsPanel.svelte'
  import TimelineControls from '#lib/timeline/components/TimelineControls.svelte'
  import { capitalizeEachWord } from '#lib/utils/string.ts'
  import { Z_INDEX } from '#lib/styles/z-index.ts'

  import CodeStore from '../stores/codeStore'
  import ConfigStore from '../stores/configStore'
  import {
    workspace,
    onDataLoaded,
    toggle3D,
    selectRailItem,
    closePanel,
    closeUnavailablePanel,
    importFiles,
  } from '#lib/workspace/workspace.svelte.ts'
  import { RAIL_LABELS } from '#lib/workspace/rail.ts'

  const selectedExampleLabel = $derived(getExampleLabel(workspace.selectedExampleId))

  let isVideoShowing = $state(false)
  let isTranscriptVisible = $state(false)
  let spaceTimeTooltip: SpaceTimeTooltip

  let isSplitScreen = $state(false)
  /** SplitPane sizes as percentages: [video, canvas] */
  let splitSizes = $state<[number, number]>([40, 60])
  /** SplitPane's `--split-divider-size`. */
  const SPLIT_DIVIDER_PX = 8
  /** Drives `pane-inert` and defers the sketch rebuild until the drag ends. */
  let isDraggingSplit = $state(false)

  $effect(() => {
    const videoState = $VideoStore
    isVideoShowing = videoState.isVisible
    isSplitScreen = videoState.isSplitScreen
  })

  let panelWidth = $state(300)
  /** Rail plus open panel: how far the canvas is pushed right. */
  let railWidth = $state(0)

  $effect(() => closeUnavailablePanel($ConfigStore.dataHasCodes))

  function toggleVideo() {
    if (!hasVideoSource()) return

    const willBeVisible = !$VideoStore.isVisible
    toggleVisibility()
    onVideoVisibilityChange(willBeVisible)
  }

  onMount(() => {
    if (shouldShowTour()) workspace.helpOpen = true
    return onDataLoaded(() => spaceTimeTooltip?.trigger())
  })
</script>

{#snippet dataIcon()}<MdFolder />{/snippet}
{#snippet peopleIcon()}<MdAccountGroup />{/snippet}
{#snippet codesIcon()}<MdTagMultiple />{/snippet}
{#snippet talkIcon()}<MdChat />{/snippet}
{#snippet filtersIcon()}<MdFilterList />{/snippet}
{#snippet selectIcon()}<MdSelectAll />{/snippet}
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
          <a class="text-2xl font-bold text-black italic" href="https://interactiongeography.org">
            IGS
          </a>
          {#if selectedExampleLabel}
            <span class="truncate text-sm opacity-70" title={selectedExampleLabel}>
              {selectedExampleLabel}
            </span>
          {/if}
        </div>
        <div class="flex-none flex items-center gap-1 px-2">
          <IconButton
            id="btn-toggle-3d"
            icon={Md3DRotation}
            label="Space-time"
            tooltip="Toggle 2D/3D"
            onclick={toggle3D}
          />
          <IconButton
            id="btn-toggle-video"
            icon={isVideoShowing ? MdVideocam : MdVideocamOff}
            label="Video"
            tooltip="Show/Hide Video"
            onclick={toggleVideo}
          />
          <IconButton
            id="btn-toggle-transcript"
            icon={isTranscriptVisible ? MdComment : MdCommentOff}
            label="Transcript"
            tooltip="Show/Hide Transcript"
            active={isTranscriptVisible}
            onclick={() => (isTranscriptVisible = !isTranscriptVisible)}
          />
        </div>
      </div>
    {/snippet}

    {#snippet leftRail()}
      <nav class="igs-left-rail" aria-label="Sidebar navigation" bind:clientWidth={railWidth}>
        <ActivityBar
          activeId={workspace.activeTab ?? undefined}
          onSelect={selectRailItem}
          items={[
            { id: 'data', label: RAIL_LABELS.data, icon: dataIcon },
            { id: 'people', label: RAIL_LABELS.people, icon: peopleIcon },
            ...($ConfigStore.dataHasCodes
              ? [{ id: 'codes', label: RAIL_LABELS.codes, icon: codesIcon }]
              : []),
            { id: 'talk', label: RAIL_LABELS.talk, icon: talkIcon },
            { id: 'filters', label: RAIL_LABELS.filters, icon: filtersIcon },
            ...(!workspace.is3DMode
              ? [{ id: 'select', label: RAIL_LABELS.select, icon: selectIcon }]
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
          aria-label={`${RAIL_LABELS[workspace.lastTab]} panel`}
          class="igs-sidepanel-shell"
          class:igs-sidepanel-shell--open={workspace.activeTab !== null}
          class:igs-sidepanel-shell--instant={workspace.instantPanel}
          style:width={`${workspace.activeTab ? panelWidth : 0}px`}
          style:--igs-drawer-z={Z_INDEX.DRAWER}
          inert={workspace.activeTab === null}
        >
          <SidePanel
            open={true}
            title={RAIL_LABELS[workspace.lastTab]}
            bind:width={panelWidth}
            onClose={closePanel}
          >
            {#if workspace.lastTab === 'data'}
              <DataPanel />
            {:else if workspace.lastTab === 'people'}
              <PeoplePanel />
            {:else if workspace.lastTab === 'codes'}
              <CodesPanel />
            {:else if workspace.lastTab === 'talk'}
              <TalkPanel />
            {:else if workspace.lastTab === 'filters'}
              <FiltersPanel />
            {:else if workspace.lastTab === 'select'}
              <SelectPanel />
            {:else if workspace.lastTab === 'settings'}
              <SettingsPanel />
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
        onresize={() => redrawCanvas()}
        ondragstart={() => (isDraggingSplit = true)}
        ondragend={() => {
          isDraggingSplit = false
          $P5Store?.rebuildAfterResize()
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
            class:cursor-crosshair={$ConfigStore.highlightToggle}
            class:pane-inert={isDraggingSplit}
          >
            {#key workspace.canvasEpoch}
              <Sketch
                sketch={igsSketch}
                onResize={(p) => {
                  if (isDraggingSplit) redrawCanvas()
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
            <div class="rotate-controls join" style="z-index: {Z_INDEX.FAB}">
              <button
                class="btn btn-sm btn-square btn-ghost join-item"
                title="Rotate floor plan left (Shift+R)"
                aria-label="Rotate floor plan left"
                onclick={() => rotateFloorplan('left')}
              >
                <MdRotateLeft />
              </button>
              <button
                class="btn btn-sm btn-square btn-ghost join-item"
                title="Rotate floor plan right (R)"
                aria-label="Rotate floor plan right"
                onclick={() => rotateFloorplan('right')}
              >
                <MdRotateRight />
              </button>
            </div>
            {#if workspace.is3DMode}
              <AxesIndicator />
            {/if}
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
          class="flex min-w-0 flex-row items-center bg-[#f6f5f3] px-2 overflow-x-auto"
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
          class="flex flex-1 items-center bg-[#f6f5f3] overflow-visible py-0.5 lg:px-1"
          style="min-width: 200px;"
        >
          <Timeline />
        </div>
      </div>
    {/snippet}
  </CanvasFrame>
</div>

{#if workspace.dataExplorerOpen}
  <div
    class="modal modal-open"
    onclick={(e) => {
      if (e.target === e.currentTarget) workspace.dataExplorerOpen = false
    }}
    onkeydown={(e) => {
      if (e.key === 'Escape') workspace.dataExplorerOpen = false
    }}
  >
    <div class="modal-box w-11/12 max-w-5xl">
      <div class="flex justify-between">
        <div class="flex flex-col">
          <h3 class="font-bold text-lg">Data Explorer</h3>
          <p>Here you will find detailed information on the data that you have uploaded.</p>
        </div>

        <button class="btn btn-circle btn-sm" onclick={() => (workspace.dataExplorerOpen = false)}>
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
        <button class="btn" onclick={() => (workspace.dataExplorerOpen = false)}>Close</button>
      </div>
    </div>
  </div>
{/if}

<IgsInfoModal />

<OnboardingTour />

<ModeIndicator />

<DataImporter
  isOpen={workspace.importOpen}
  onClose={() => (workspace.importOpen = false)}
  onImport={importFiles}
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

  /* Top-left, over the floor plan they rotate. Translucent like the 3D axes
     legend so both read as canvas overlays. */
  .rotate-controls {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    background: rgb(255 255 255 / 0.85);
    border: 1px solid rgb(0 0 0 / 0.1);
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
