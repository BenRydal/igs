import { writable } from 'svelte/store'
import type { IgsP5 } from '../lib/p5/igs-p5'

export type P5StoreState = IgsP5 | null

const P5Store = writable<P5StoreState>(null)

export default P5Store
