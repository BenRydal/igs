import { writable } from 'svelte/store'

/** Size of the loaded floorplan image, or null when none is loaded. Published by FloorPlan. */
const floorplanStore = writable<{ width: number; height: number } | null>(null)

export default floorplanStore
