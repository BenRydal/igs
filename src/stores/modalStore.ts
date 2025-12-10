import { writable, derived } from 'svelte/store'

export type ModalId =
  | 'settings'
  | 'dataExplorer'
  | 'help'
  | 'commandPalette'
  | 'fileImport'
  | 'shortcuts'

export interface ModalState {
  id: ModalId
  isOpen: boolean
  props?: Record<string, unknown>
  onClose?: () => void
}

export interface OpenModalOptions {
  props?: Record<string, unknown>
  onClose?: () => void
  exclusive?: boolean
}

interface ModalStackState {
  stack: ModalState[]
  activeModalId: ModalId | null
}

const initialState: ModalStackState = {
  stack: [],
  activeModalId: null,
}

const modalStackStore = writable<ModalStackState>(initialState)

export const activeModal = derived(modalStackStore, ($store) => {
  if ($store.stack.length === 0) return null
  return $store.stack[$store.stack.length - 1]
})

export function openModal(id: ModalId, options: OpenModalOptions = {}): void {
  const { props, onClose, exclusive = false } = options

  modalStackStore.update((state) => {
    if (exclusive && state.stack.length > 0) {
      state.stack.forEach((modal) => {
        if (modal.onClose) modal.onClose()
      })
      state.stack = []
    }

    const existingIndex = state.stack.findIndex((modal) => modal.id === id)
    if (existingIndex !== -1) {
      const existingModal = state.stack[existingIndex]
      state.stack.splice(existingIndex, 1)
      state.stack.push({
        ...existingModal,
        props: props || existingModal.props,
        onClose: onClose || existingModal.onClose,
      })
    } else {
      state.stack.push({
        id,
        isOpen: true,
        props,
        onClose,
      })
    }

    state.activeModalId = id
    return state
  })
}

export function closeModal(id?: ModalId): void {
  modalStackStore.update((state) => {
    if (state.stack.length === 0) return state

    let closedModal: ModalState | undefined

    if (id) {
      const index = state.stack.findIndex((modal) => modal.id === id)
      if (index !== -1) {
        closedModal = state.stack[index]
        state.stack.splice(index, 1)
      }
    } else {
      closedModal = state.stack.pop()
    }

    if (closedModal?.onClose) {
      closedModal.onClose()
    }

    state.activeModalId = state.stack.length > 0 ? state.stack[state.stack.length - 1].id : null
    return state
  })
}

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    modalStackStore.update((state) => {
      if (state.stack.length === 0) return state

      const closedModal = state.stack.pop()
      if (closedModal?.onClose) {
        closedModal.onClose()
      }

      event.preventDefault()
      event.stopPropagation()

      state.activeModalId = state.stack.length > 0 ? state.stack[state.stack.length - 1].id : null
      return state
    })
  }
}

export function setupModalListeners(): () => void {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener('keydown', handleEscapeKey)

  return () => {
    window.removeEventListener('keydown', handleEscapeKey)
  }
}
