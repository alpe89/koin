/**
 * Token storage strategy:
 * - Installed PWA (standalone mode): IndexedDB via a simple wrapper
 * - Browser tab: sessionStorage
 *
 * This module abstracts the choice so the rest of the app does not need to
 * know which backing store is used at runtime.
 */

const TOKEN_KEY = 'koin_auth_token'
const IDB_DB_NAME = 'koin'
const IDB_STORE_NAME = 'auth'
const IDB_VERSION = 1

function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

// --- IndexedDB helpers ---

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, IDB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME)
      }
    }

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result)
    request.onerror = () => reject(request.error)
  })
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readonly')
    const store = tx.objectStore(IDB_STORE_NAME)
    const request = store.get(key)
    request.onsuccess = () => resolve((request.result as string | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite')
    const store = tx.objectStore(IDB_STORE_NAME)
    const request = store.put(value, key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite')
    const store = tx.objectStore(IDB_STORE_NAME)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// --- Public API ---

export async function getToken(): Promise<string | null> {
  if (isStandaloneMode()) {
    return idbGet(TOKEN_KEY)
  }
  return sessionStorage.getItem(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  if (isStandaloneMode()) {
    await idbSet(TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export async function clearToken(): Promise<void> {
  if (isStandaloneMode()) {
    await idbDelete(TOKEN_KEY)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}
