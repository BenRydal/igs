import { flushSync, tick } from 'svelte'
import { get } from 'svelte/store'
import { SvelteSet } from 'svelte/reactivity'
import { Core } from '#lib'
import { EXAMPLE_DATASETS, type CollectionId } from '#lib/core/example-datasets.ts'
import { sortFilesForImport } from '#lib/core/import-order.ts'
import type { IgsP5 } from '#lib/p5/igs-p5.ts'
import { redrawCanvas, withRedrawSuspended } from '#lib/utils/p5.ts'
import {
  clearUsers,
  clearCodes as clearCodesWithHistory,
  clearAllData,
} from '#lib/history/data-actions.ts'
import { isRailTab, isTabAvailable, type RailTab } from '#lib/workspace/rail.ts'
import { nextRevision } from '../../models/user.ts'
import UserStore from '../../stores/userStore.ts'
import P5Store from '../../stores/p5Store.ts'
import ConfigStore from '../../stores/configStore.ts'
import { resetGPS } from '../../stores/gpsStore.ts'
import { reset as resetVideo } from '../../stores/videoStore.ts'

interface WorkspaceState {
  is3DMode: boolean
  activeTab: RailTab | null
  lastTab: RailTab
  instantPanel: boolean
  helpOpen: boolean
  cheatsheetOpen: boolean
  canvasEpoch: number
  selectedExampleId: string
}

export const workspace = $state<WorkspaceState>({
  is3DMode: true,
  activeTab: null,
  lastTab: 'data',
  instantPanel: false,
  helpOpen: false,
  cheatsheetOpen: false,
  canvasEpoch: 0,
  selectedExampleId: '',
})

export const expandedCollections = new SvelteSet<CollectionId>()

let p5Instance: IgsP5 | null = null
let core: Core | null = null
let dataLoaded: () => void = () => {}

P5Store.subscribe((instance) => {
  p5Instance = instance
  if (instance) core = new Core(instance)
})

function requireCore(): Core {
  if (!core) throw new Error('The canvas has not started yet')
  return core
}

export function onDataLoaded(listener: () => void): () => void {
  dataLoaded = listener
  return () => {
    dataLoaded = () => {}
  }
}

function tabIsAvailable(tab: RailTab): boolean {
  return isTabAvailable(tab, {
    is3DMode: workspace.is3DMode,
    dataHasCodes: get(ConfigStore).dataHasCodes,
  })
}

export function toggle3D() {
  if (!p5Instance) return
  p5Instance.handle3D.update()
  workspace.is3DMode = p5Instance.handle3D.getIs3DMode()
}

export function downloadCodes() {
  p5Instance?.saveCodeFile()
}

export function toggleHelp() {
  workspace.helpOpen = !workspace.helpOpen
}

export function openCheatsheet() {
  workspace.cheatsheetOpen = true
}

export function selectRailItem(id: string) {
  if (id === 'help') {
    toggleHelp()
    return
  }
  if (!isRailTab(id)) return
  workspace.instantPanel = false
  workspace.activeTab = workspace.activeTab === id ? null : id
  if (workspace.activeTab) workspace.lastTab = workspace.activeTab
}

export function openPanel(tab: RailTab | null) {
  workspace.instantPanel = true
  workspace.activeTab = tab && tabIsAvailable(tab) ? tab : null
  if (workspace.activeTab) workspace.lastTab = workspace.activeTab
  flushSync()
}

export function closePanel() {
  workspace.activeTab = null
}

export function closeUnavailablePanel(dataHasCodes: boolean) {
  const tab = workspace.activeTab
  if (tab && !isTabAvailable(tab, { is3DMode: workspace.is3DMode, dataHasCodes })) {
    workspace.activeTab = null
  }
}

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

export async function clearAll() {
  resetVideo()
  clearAllData()

  const current = requireCore()
  current.codeData = []
  current.movementData = []
  current.conversationData = []
  resetGPS()
  current.gpsMovementData = []

  ConfigStore.update((config) => ({
    ...config,
    dataHasCodes: false,
    isPathColorMode: false,
    maxStopLength: 0,
  }))

  const prev = p5Instance
  ;(prev?.drawingContext as WebGL2RenderingContext | undefined)
    ?.getExtension('WEBGL_lose_context')
    ?.loseContext()
  workspace.canvasEpoch += 1
  await waitForCanvasRemount(prev)
  await tick()
}

export function clearMovement() {
  clearUsers()
  const current = requireCore()
  current.movementData = []
  current.gpsMovementData = []
  resetGPS()
  redrawCanvas()
}

export function clearConversation() {
  UserStore.update((users) =>
    users.map((user) => {
      user.conversationIsLoaded = false
      user.dataTrail = user.dataTrail.map((dataPoint) => {
        dataPoint.speech = ''
        return dataPoint
      })
      user.revision = nextRevision()
      return user
    })
  )
  requireCore().conversationData = []
  redrawCanvas()
}

export function clearCodes() {
  clearCodesWithHistory()
  requireCore().codeData = []
  UserStore.update((users) =>
    users.map((user) => {
      user.dataTrail = user.dataTrail.map((dataPoint) => {
        dataPoint.codes = []
        return dataPoint
      })
      user.revision = nextRevision()
      return user
    })
  )

  ConfigStore.update((config) => ({
    ...config,
    dataHasCodes: false,
    isPathColorMode: false,
  }))
  redrawCanvas()
}

export async function importFiles(files: File[], clearExisting: boolean) {
  if (clearExisting) {
    await clearAll()
  }

  const sortedFiles = await sortFilesForImport(files)

  await withRedrawSuspended(async () => {
    for (const file of sortedFiles) {
      await requireCore().testFileTypeForProcessingAsync(file)
    }
  })

  redrawCanvas()
  dataLoaded()
}

async function loadExampleData(id: string) {
  await clearAll()
  await requireCore().handleExampleDropdown({ target: { value: id } })
  redrawCanvas()
  dataLoaded()
}

export function loadExample(id: string) {
  loadExampleData(id)
  workspace.selectedExampleId = id
  const collection = EXAMPLE_DATASETS[id]?.collection
  if (collection) expandedCollections.add(collection)
}
