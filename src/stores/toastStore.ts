import { writable } from 'svelte/store'

/**
 * Toast notification types
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error'

/**
 * Toast notification interface
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string
  /** Message to display */
  message: string
  /** Visual style/severity of the toast */
  type: ToastType
  /** Duration in milliseconds (0 = persistent) */
  duration: number
  /** Timestamp when toast was created */
  createdAt: number
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Options for creating a toast
 */
export interface ToastOptions {
  /** Duration in milliseconds (0 = persistent, default 3000) */
  duration?: number
  /** Optional action button */
  action?: Toast['action']
}

const MAX_TOASTS = 5
const DEFAULT_DURATION = 3000

export type ToastStoreState = Toast[]

/**
 * Create a toast notification store
 *
 * Manages a stack of toast notifications with automatic removal and limits.
 */
function createToastStore() {
  const { subscribe, update } = writable<ToastStoreState>([])

  /**
   * Add a new toast notification
   * @param message - Message to display
   * @param type - Visual style/severity
   * @param options - Optional configuration
   * @returns Unique toast ID
   *
   * @example
   * toastStore.add('File saved', 'success');
   * toastStore.add('Error loading', 'error', { duration: 5000 });
   */
  function add(message: string, type: ToastType = 'info', options?: ToastOptions): string {
    const id = crypto.randomUUID()
    const toast: Toast = {
      id,
      message,
      type,
      duration: options?.duration ?? DEFAULT_DURATION,
      createdAt: Date.now(),
      action: options?.action,
    }

    update((toasts) => {
      const newToasts = [toast, ...toasts]
      // Limit to MAX_TOASTS
      return newToasts.slice(0, MAX_TOASTS)
    })

    // Auto-remove after duration (unless 0)
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration)
    }

    return id
  }

  /**
   * Remove a specific toast
   * @param id - Toast ID to remove
   */
  function remove(id: string): void {
    update((toasts) => toasts.filter((t) => t.id !== id))
  }

  /**
   * Clear all toasts
   */
  function clear(): void {
    update(() => [])
  }

  return {
    subscribe,
    add,
    remove,
    clear,
    // Convenience methods
    info: (msg: string, opts?: ToastOptions) => add(msg, 'info', opts),
    success: (msg: string, opts?: ToastOptions) => add(msg, 'success', opts),
    warning: (msg: string, opts?: ToastOptions) => add(msg, 'warning', opts),
    error: (msg: string, opts?: ToastOptions) => add(msg, 'error', opts),
  }
}

/**
 * Global toast store instance
 */
export const toastStore = createToastStore()

/**
 * Convenience function for adding toasts
 *
 * @example
 * showToast('Operation complete', 'success');
 * showToast('Failed to save', 'error', { duration: 5000 });
 */
export const showToast = toastStore.add
