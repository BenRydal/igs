import ConfigStore, { type ConfigStoreType } from '../../../stores/configStore.ts'
import { redrawCanvas } from '#lib/utils/p5.ts'

type ToggleKey = {
  [K in keyof ConfigStoreType]: ConfigStoreType[K] extends boolean ? K : never
}[keyof ConfigStoreType]

export function handleConfigChangeFromInput(e: Event, key: keyof ConfigStoreType) {
  const target = e.target as HTMLInputElement
  ConfigStore.update((value) => ({ ...value, [key]: parseFloat(target.value) }))
  redrawCanvas()
}

export function handleConfigChange(
  key: keyof ConfigStoreType,
  value: ConfigStoreType[keyof ConfigStoreType]
) {
  ConfigStore.update((store) => ({ ...store, [key]: value }))
  redrawCanvas()
}

export function toggleSelection(selection: ToggleKey, toggleOptions: readonly ToggleKey[]) {
  ConfigStore.update((store: ConfigStoreType) => {
    const updatedStore = { ...store }
    toggleOptions.forEach((key) => {
      if (key.endsWith('Toggle')) {
        updatedStore[key] = key === selection ? !updatedStore[key] : false
      }
    })
    return updatedStore
  })
  redrawCanvas()
}
