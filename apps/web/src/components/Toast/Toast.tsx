import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'

interface ToastMessage {
  id: number
  message: string
  type: 'default' | 'error'
}

interface ToastContextValue {
  showToast: (message: string, type?: 'default' | 'error') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const showToast = useCallback((message: string, type: 'default' | 'error' = 'default') => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])

    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      timersRef.current.delete(id)
    }, 3000)

    timersRef.current.set(id, timer)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className={styles['toast-container']} aria-live="polite" aria-atomic="false">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={[styles.toast, t.type === 'error' ? styles['toast--error'] : '']
                .filter(Boolean)
                .join(' ')}
              role="status"
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
