import { useNavigate } from 'react-router-dom'
import ModernPage from '../../components/ModernPage'
import { pageConfigs } from '../../data/pageConfigs'

export default function AdminDashboardPage() {
  const navigate = useNavigate()

  const actionHandlers = {
    Exporter: () => navigate('/manager/exports'),
  }

  return <ModernPage config={pageConfigs.adminDashboard} actionHandlers={actionHandlers} />
}
