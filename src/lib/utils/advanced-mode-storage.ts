const STORAGE_KEY = 'igs-advanced-mode'

export function loadAdvancedMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveAdvancedMode(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Ignore storage errors
  }
}
