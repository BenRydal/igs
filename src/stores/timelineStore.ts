import { writable } from 'svelte/store'
import { Timeline } from '../models/timeline'

export type TimelineStoreState = Timeline

const TimelineStore = writable<TimelineStoreState>(new Timeline())
export default TimelineStore
