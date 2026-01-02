import { writable } from 'svelte/store'

export interface ConversationTurn {
  time: number
  speaker: string
  text: string
  color?: string
}

export interface HoveredConversation {
  turns: ConversationTurn[]
  mouseX: number
  mouseY: number
}

export interface TimelineHover {
  time: number
  mouseX: number
  mouseY: number
}

const HoveredConversationStore = writable<HoveredConversation | null>(null)
const TimelineHoverStore = writable<TimelineHover | null>(null)

export function setHoveredConversation(turns: ConversationTurn[], mouseX: number, mouseY: number): void {
  HoveredConversationStore.set({ turns, mouseX, mouseY })
}

export function clearHoveredConversation(): void {
  HoveredConversationStore.set(null)
}

export function setTimelineHover(time: number, mouseX: number, mouseY: number): void {
  TimelineHoverStore.set({ time, mouseX, mouseY })
}

export function clearTimelineHover(): void {
  TimelineHoverStore.set(null)
}

export { TimelineHoverStore }
export default HoveredConversationStore
