import { writable, get } from 'svelte/store'

export type UndoableAction =
  | 'config.toggle'
  | 'config.slider'
  | 'config.text'
  | 'config.reset'
  | 'user.toggle'
  | 'user.color'
  | 'code.toggle'
  | 'code.color'
  | 'data.clear'

export interface HistoryEntry {
  id: string
  timestamp: number
  actionType: UndoableAction | string
  actionLabel: string // Human-readable: "Toggled movement trails"
  undo: () => void // Function to undo this action
  redo: () => void // Function to redo this action
}

// Legacy type alias for backwards compatibility
export type HistoryAction = Omit<HistoryEntry, 'id' | 'timestamp'>

export interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
  isUndoing: boolean
  maxSize: number
}

const initialState: HistoryState = {
  past: [],
  future: [],
  isUndoing: false,
  maxSize: 50,
}

function createHistoryStore() {
  const { subscribe, set, update } = writable<HistoryState>(initialState)

  return {
    subscribe,

    /**
     * Push a new action to the history
     * Clears the future stack and respects maxSize
     */
    push(entry: HistoryAction): void {
      update((state) => {
        // Don't record history during undo/redo operations
        if (state.isUndoing) {
          return state
        }

        // Generate unique ID and timestamp
        const historyEntry: HistoryEntry = {
          ...entry,
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        }

        // Check for debouncing - if last action was same type within 300ms, replace it
        const lastEntry = state.past[state.past.length - 1]
        if (
          lastEntry &&
          lastEntry.actionType === historyEntry.actionType &&
          historyEntry.timestamp - lastEntry.timestamp < 300 &&
          historyEntry.actionType === 'config.slider'
        ) {
          // Replace the last entry with the new one for slider changes
          const newPast = [...state.past]
          newPast[newPast.length - 1] = historyEntry
          return {
            ...state,
            past: newPast,
            future: [], // Clear future on new action
          }
        }

        // Add to past and clear future
        const newPast = [...state.past, historyEntry]

        // Respect maxSize by removing oldest entries
        if (newPast.length > state.maxSize) {
          newPast.shift()
        }

        return {
          ...state,
          past: newPast,
          future: [], // Clear future when new action is pushed
        }
      })
    },

    /**
     * Undo the last action
     * @returns The action label if successful, null if nothing to undo
     */
    undo(): string | null {
      let actionLabel: string | null = null

      update((state) => {
        if (state.past.length === 0) {
          return state
        }

        // Get the last action from past
        const lastAction = state.past[state.past.length - 1]
        actionLabel = lastAction.actionLabel

        // Set isUndoing flag to prevent recursive history entries
        const newState = { ...state, isUndoing: true }

        // Execute the undo function
        try {
          lastAction.undo()
        } catch (error) {
          console.error('Error executing undo:', error)
          return { ...state, isUndoing: false }
        }

        // Move from past to future
        const newPast = state.past.slice(0, -1)
        const newFuture = [...state.future, lastAction]

        return {
          ...newState,
          past: newPast,
          future: newFuture,
          isUndoing: false,
        }
      })

      return actionLabel
    },

    /**
     * Redo the last undone action
     * @returns The action label if successful, null if nothing to redo
     */
    redo(): string | null {
      let actionLabel: string | null = null

      update((state) => {
        if (state.future.length === 0) {
          return state
        }

        // Get the last undone action from future
        const lastUndone = state.future[state.future.length - 1]
        actionLabel = lastUndone.actionLabel

        // Set isUndoing flag to prevent recursive history entries
        const newState = { ...state, isUndoing: true }

        // Execute the redo function
        try {
          lastUndone.redo()
        } catch (error) {
          console.error('Error executing redo:', error)
          return { ...state, isUndoing: false }
        }

        // Move from future to past
        const newFuture = state.future.slice(0, -1)
        const newPast = [...state.past, lastUndone]

        // Respect maxSize
        if (newPast.length > state.maxSize) {
          newPast.shift()
        }

        return {
          ...newState,
          past: newPast,
          future: newFuture,
          isUndoing: false,
        }
      })

      return actionLabel
    },
  }
}

export const historyStore = createHistoryStore()
