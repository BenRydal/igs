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

const HoveredConversationStore = writable<HoveredConversation | null>(null)

export function setHoveredConversation(turns: ConversationTurn[], mouseX: number, mouseY: number): void {
  HoveredConversationStore.set({ turns, mouseX, mouseY })
}

export function clearHoveredConversation(): void {
  HoveredConversationStore.set(null)
}

export default HoveredConversationStore
