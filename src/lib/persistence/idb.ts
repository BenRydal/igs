const DB_NAME = 'igs'
const STORE = 'session'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = op(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(request.result as T)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
  )
}

/** Values go through structured clone, so Blobs and plain objects store as-is. */
export function idbGet<T>(key: string): Promise<T | undefined> {
  return run<T | undefined>('readonly', (store) => store.get(key))
}

export function idbSet(key: string, value: unknown): Promise<void> {
  return run<void>('readwrite', (store) => store.put(value, key))
}

export function idbDelete(key: string): Promise<void> {
  return run<void>('readwrite', (store) => store.delete(key))
}

export function idbAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}
