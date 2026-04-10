import { type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import styles from './AppShell.module.css'

interface NavItem {
  to: string
  label: string
  icon: string
  /** Match exactly this path for active state */
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: 'home', exact: true },
  { to: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { to: '/report', label: 'Report', icon: 'bar_chart' },
  { to: '/group', label: 'Group', icon: 'group' },
]

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { location } = useRouterState()
  const currentPath = location.pathname

  return (
    <div className={styles.shell}>
      {/* Skip to main content — first focusable element */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <nav className={styles['bottom-nav']} aria-label="Main navigation">
        <ul className={styles['bottom-nav__list']}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? currentPath === item.to
              : currentPath.startsWith(item.to)

            return (
              <li key={item.to} className={styles['bottom-nav__item']}>
                <Link
                  to={item.to}
                  className={[
                    styles['bottom-nav__link'],
                    isActive ? styles['bottom-nav__link--active'] : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles['bottom-nav__indicator']} aria-hidden="true" />
                  <span
                    className={`${styles['bottom-nav__icon']} material-symbols-outlined`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className={styles['bottom-nav__label']}>{item.label}</span>
                  {isActive && <span className="sr-only">(current page)</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <main id="main-content" className={styles.main}>
        {children}
      </main>
    </div>
  )
}
