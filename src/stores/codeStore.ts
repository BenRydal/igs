import { writable } from 'svelte/store'

export interface CodeEntry {
  enabled: boolean
  code: string
  color: string
}

export type CodeStoreState = CodeEntry[]

const CodeStore = writable<CodeStoreState>([])

export default CodeStore
