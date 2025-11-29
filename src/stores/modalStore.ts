import { writable, derived, get } from 'svelte/store'

/**
 * Unique identifier for each modal in the application
 */
export type ModalId =
  | 'settings'
  | 'dataExplorer'
  | 'help'
  | 'commandPalette'
  | 'importWizard'
  | 'shortcuts'

/**
 * State for a single modal instance
 */
export interface ModalState {
  /** Unique modal identifier */
  id: ModalId
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Optional props to pass to the modal component */
  props?: Record<string, unknown>
  /** Optional callback to execute when modal closes */
  onClose?: () => void
}

/**
 * Internal state structure for the modal stack
 */
export interface ModalStackState {
  /** Stack of currently open modals (last = topmost) */
  stack: ModalState[]
  /** ID of the currently active (topmost) modal */
  activeModalId: ModalId | null
}

export type ModalStoreState = ModalStackState

/**
 * Options for opening a modal
 */
export interface OpenModalOptions {
  /** Optional props to pass to the modal component */
  props?: Record<string, unknown>
  /** Optional callback to execute when modal closes */
  onClose?: () => void
  /** If true, close all other modals before opening this one */
  exclusive?: boolean
}

// Initial state
const initialState: ModalStackState = {
  stack: [],
  activeModalId: null,
}

// Create the main writable store
const modalStackStore = writable<ModalStackState>(initialState)

/**
 * Derived store that returns the currently active (topmost) modal, or null if none is open
 */
export const activeModal = derived(modalStackStore, ($store) => {
  if ($store.stack.length === 0) return null
  return $store.stack[$store.stack.length - 1]
})

/**
 * Derived store that returns true if any modal is currently open
 */
export const anyModalOpen = derived(modalStackStore, ($store) => {
  return $store.stack.length > 0
})

/**
 * Derived store that exposes the full modal stack for debugging
 */
export const modalStack = derived(modalStackStore, ($store) => {
  return $store.stack
})

/**
 * Custom event detail for modal events
 */
export interface ModalEventDetail {
  id: ModalId
  props?: Record<string, unknown>
}

/**
 * Dispatch a custom modal event
 */
function dispatchModalEvent(
  eventName: 'modal:open' | 'modal:close',
  detail: ModalEventDetail
): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(eventName, { detail, bubbles: true, composed: true })
    window.dispatchEvent(event)
  }
}

/**
 * Open a modal and add it to the stack
 * @param id - Unique identifier for the modal
 * @param options - Optional configuration for the modal
 * @returns void
 *
 * @example
 * openModal('settings');
 * openModal('help', { props: { section: 'keyboard-shortcuts' } });
 * openModal('settings', { exclusive: true, onClose: () => console.log('Settings closed') });
 */
export function openModal(id: ModalId, options: OpenModalOptions = {}): void {
  const { props, onClose, exclusive = false } = options

  modalStackStore.update((state) => {
    // If exclusive mode, clear all other modals first
    if (exclusive && state.stack.length > 0) {
      // Call onClose callbacks for all modals being closed
      state.stack.forEach((modal) => {
        if (modal.onClose) {
          modal.onClose()
        }
        dispatchModalEvent('modal:close', { id: modal.id, props: modal.props })
      })
      state.stack = []
    }

    // Check if modal is already open
    const existingIndex = state.stack.findIndex((modal) => modal.id === id)
    if (existingIndex !== -1) {
      // Modal already open, just update it and move to top
      const existingModal = state.stack[existingIndex]
      state.stack.splice(existingIndex, 1)
      state.stack.push({
        ...existingModal,
        props: props || existingModal.props,
        onClose: onClose || existingModal.onClose,
      })
    } else {
      // Add new modal to stack
      state.stack.push({
        id,
        isOpen: true,
        props,
        onClose,
      })
    }

    // Update active modal ID
    state.activeModalId = id

    // Dispatch open event
    dispatchModalEvent('modal:open', { id, props })

    return state
  })

  // Prevent body scroll when first modal opens
  updateBodyScroll()
}

/**
 * Close a specific modal or the topmost modal if no ID is provided
 * @param id - Optional modal ID to close. If not provided, closes the topmost modal
 * @returns void
 *
 * @example
 * closeModal(); // Closes topmost modal
 * closeModal('settings'); // Closes settings modal specifically
 */
export function closeModal(id?: ModalId): void {
  modalStackStore.update((state) => {
    if (state.stack.length === 0) return state

    let closedModal: ModalState | undefined

    if (id) {
      // Close specific modal
      const index = state.stack.findIndex((modal) => modal.id === id)
      if (index !== -1) {
        closedModal = state.stack[index]
        state.stack.splice(index, 1)
      }
    } else {
      // Close topmost modal
      closedModal = state.stack.pop()
    }

    // Call onClose callback if it exists
    if (closedModal?.onClose) {
      closedModal.onClose()
    }

    // Dispatch close event
    if (closedModal) {
      dispatchModalEvent('modal:close', { id: closedModal.id, props: closedModal.props })
    }

    // Update active modal ID
    state.activeModalId = state.stack.length > 0 ? state.stack[state.stack.length - 1].id : null

    return state
  })

  // Re-enable body scroll if no modals are open
  updateBodyScroll()
}

/**
 * Close all open modals
 * @returns void
 *
 * @example
 * closeAllModals();
 */
export function closeAllModals(): void {
  const state = get(modalStackStore)

  // Call onClose callbacks for all modals
  state.stack.forEach((modal) => {
    if (modal.onClose) {
      modal.onClose()
    }
    dispatchModalEvent('modal:close', { id: modal.id, props: modal.props })
  })

  modalStackStore.set({
    stack: [],
    activeModalId: null,
  })

  // Re-enable body scroll
  updateBodyScroll()
}

/**
 * Check if a specific modal is currently open
 * @param id - Modal ID to check
 * @returns true if the modal is in the stack, false otherwise
 *
 * @example
 * if (isModalOpen('settings')) {
 *   console.log('Settings modal is open');
 * }
 */
export function isModalOpen(id: ModalId): boolean {
  const state = get(modalStackStore)
  return state.stack.some((modal) => modal.id === id)
}

/**
 * Get the currently active (topmost) modal
 * @returns The active modal state or null if no modals are open
 *
 * @example
 * const active = getActiveModal();
 * if (active) {
 *   console.log(`Active modal: ${active.id}`);
 * }
 */
export function getActiveModal(): ModalState | null {
  const state = get(modalStackStore)
  if (state.stack.length === 0) return null
  return state.stack[state.stack.length - 1]
}

/**
 * Check if a modal can be opened (useful for exclusive modals)
 * @param id - Modal ID to check
 * @returns true if the modal can be opened, false if it's already the active modal
 *
 * @example
 * if (canOpenModal('settings')) {
 *   openModal('settings');
 * }
 */
export function canOpenModal(id: ModalId): boolean {
  const active = getActiveModal()
  return active === null || active.id !== id
}

/**
 * Update body scroll state based on modal stack
 * Prevents scroll when modals are open, re-enables when all are closed
 */
function updateBodyScroll(): void {
  if (typeof window === 'undefined') return

  const state = get(modalStackStore)
  const body = document.body

  if (state.stack.length > 0) {
    // Prevent body scroll
    body.style.overflow = 'hidden'
  } else {
    // Re-enable body scroll
    body.style.overflow = ''
  }
}

/**
 * Handle Escape key press to close the topmost modal
 * @param event - Keyboard event
 */
export function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    const active = getActiveModal()
    if (active) {
      event.preventDefault()
      event.stopPropagation()
      closeModal()
    }
  }
}

/**
 * Set up global event listeners for modal management
 * Should be called once when the app initializes
 * @returns Cleanup function to remove event listeners
 *
 * @example
 * // In your root layout or app component
 * const cleanup = setupModalListeners();
 * onDestroy(cleanup);
 */
export function setupModalListeners(): () => void {
  if (typeof window === 'undefined') return () => {}

  const escapeHandler = (event: KeyboardEvent) => handleEscapeKey(event)

  window.addEventListener('keydown', escapeHandler)

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', escapeHandler)
  }
}

/**
 * Main modal store export for direct subscription
 * Use derived stores (activeModal, anyModalOpen, modalStack) for most cases
 */
export const modalStore = {
  subscribe: modalStackStore.subscribe,
  openModal,
  closeModal,
  closeAllModals,
  isModalOpen,
  getActiveModal,
  canOpenModal,
  setupModalListeners,
  handleEscapeKey,
}

export default modalStore
