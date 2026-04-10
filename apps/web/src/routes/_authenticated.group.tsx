import { createFileRoute } from '@tanstack/react-router'
import { GroupPage } from '../pages/group/GroupPage'

export const Route = createFileRoute('/_authenticated/group')({
  component: GroupPage,
})
