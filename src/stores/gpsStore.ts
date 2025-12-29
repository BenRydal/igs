import { writable, get } from 'svelte/store'
import type { GPSState, GPSBounds, MapboxStyle } from '$lib/gps/gps-types'

const initialState: GPSState = {
  isGPSMode: false,
  bounds: null,
  mapStyle: 'streets-v12',
  isLoading: false,
}

const GPSStore = writable<GPSState>(initialState)

export function setGPSMode(enabled: boolean): void {
  GPSStore.update((state) => ({ ...state, isGPSMode: enabled }))
}

export function setBounds(bounds: GPSBounds): void {
  GPSStore.update((state) => ({ ...state, bounds }))
}

export function setMapStyle(style: MapboxStyle): void {
  GPSStore.update((state) => ({ ...state, mapStyle: style }))
}

export function setLoading(loading: boolean): void {
  GPSStore.update((state) => ({ ...state, isLoading: loading }))
}

export function resetGPS(): void {
  GPSStore.set(initialState)
}

export function getGPSState(): GPSState {
  return get(GPSStore)
}

export default GPSStore
