import { writable } from 'svelte/store'
import type p5 from 'p5'

export type P5StoreState = p5 | null

const P5Store = writable<P5StoreState>(null)

export default P5Store
