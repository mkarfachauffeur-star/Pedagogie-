import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ModernPage from '../../components/ModernPage'
import AddStudentModal from '../../components/AddStudentModal'
import { pageConfigs } from '../../data/pageConfigs'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [addStudentOpen, setAddStudentOpen] = useState(false)

  const actionHandlers = {
    'Ajouter un élève': () => setAddStudentOpen(true),
    Exporter: () => navigate('/manager/exports'),
  }

  return (
    <>
      <ModernPage config={pageConfigs.adminDashboard} actionHandlers={actionHandlers} />
      <AddStudentModal
        open={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onCreated={() => navigate('/manager/students')}
      />
    </>
  )
}
