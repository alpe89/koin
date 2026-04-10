import { useState } from 'react'
import styles from './Avatar.module.css'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

interface AvatarProps {
  displayName: string
  avatarUrl?: string | null
  size?: AvatarSize
  className?: string
}

// 8 warm accessible colours for initials fallback
const INITIALS_PALETTE = [
  { bg: '#b45309', text: '#ffffff' }, // amber-700
  { bg: '#92400e', text: '#ffffff' }, // amber-800
  { bg: '#065f46', text: '#ffffff' }, // emerald-800
  { bg: '#1e40af', text: '#ffffff' }, // blue-800
  { bg: '#6d28d9', text: '#ffffff' }, // violet-700
  { bg: '#be185d', text: '#ffffff' }, // pink-700
  { bg: '#0f766e', text: '#ffffff' }, // teal-700
  { bg: '#7c3aed', text: '#ffffff' }, // violet-600
]

function getInitialsColour(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return INITIALS_PALETTE[Math.abs(hash) % INITIALS_PALETTE.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export function Avatar({ displayName, avatarUrl, size = 'md', className }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const colour = getInitialsColour(displayName)
  const initials = getInitials(displayName)
  const showImage = avatarUrl && !imgFailed

  const sizeClass = styles[`avatar--${size}`]

  if (showImage) {
    return (
      <span
        className={[styles.avatar, sizeClass, className].filter(Boolean).join(' ')}
        aria-label={`${displayName}'s avatar`}
      >
        <img
          src={avatarUrl}
          alt={`${displayName}'s avatar`}
          className={styles.avatar__img}
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      </span>
    )
  }

  return (
    <span
      className={[styles.avatar, sizeClass, className].filter(Boolean).join(' ')}
      style={
        {
          '--avatar-bg': colour.bg,
          '--avatar-text': colour.text,
        } as React.CSSProperties
      }
      aria-label={`${displayName}'s avatar`}
    >
      <span className={styles.avatar__initials}>{initials}</span>
    </span>
  )
}
