import { createFileRoute } from '@tanstack/react-router'
import { JoinPage } from '../pages/join/JoinPage'

export const Route = createFileRoute('/join')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: JoinPage,
})
