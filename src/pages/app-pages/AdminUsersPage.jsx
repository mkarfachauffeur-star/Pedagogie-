import ModernPage from '../../components/ModernPage'
import { pageConfigs } from '../../data/pageConfigs'
import InviteUserForm from '../../components/InviteUserForm'

export default function AdminUsersPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <ModernPage config={pageConfigs.adminUsers} />
      <InviteUserForm />
    </div>
  )
}
