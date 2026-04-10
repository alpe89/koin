import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Element to return focus to when the sheet closes */
  returnFocusRef?: React.RefObject<HTMLElement | null>
  labelId?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  returnFocusRef,
  labelId,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleId = labelId ?? 'bottom-sheet-title'

  // Focus trap + return focus on close
  useEffect(() => {
    if (!isOpen) return

    const sheet = sheetRef.current
    if (!sheet) return

    // Focus the first focusable element
    const focusable = sheet.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable.length > 0) {
      focusable[0].focus()
    }

    return () => {
      returnFocusRef?.current?.focus()
    }
  }, [isOpen, returnFocusRef])

  // Escape key closes the sheet
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    // Focus trap
    if (e.key === 'Tab' && sheetRef.current) {
      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.content}>
          {title && (
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
