import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import ProfileSelection from './pages/ProfileSelection'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import { initDemoMode } from './utils/demoMode'
import { getStoredRole } from './utils/authSession'

import ManagerDashboardPage from './pages/archive/AdminDashboardPage'
import ManagerStudentsPage from './pages/archive/AdminStudentsPage'
import ManagerTeachersPage from './pages/archive/AdminTeachersPage'
import ManagerUsersPage from './pages/archive/AdminUsersPage'
import ManagerPlanningPage from './pages/archive/AdminPlanningPage'
import ManagerVehiclesPage from './pages/archive/AdminVehiclesPage'
import ManagerContractsPage from './pages/archive/AdminContractsPage'
import ManagerPaymentsPage from './pages/archive/AdminPaymentsPage'
import ManagerStatisticsPage from './pages/archive/AdminStatisticsPage'
import ManagerSettingsPage from './pages/archive/AdminSettingsPage'
import ManagerMessagesPage from './pages/archive/ManagerMessagesPage'

import StudentDashboardPage from './pages/archive/StudentDashboardPage'
import StudentLessonsPage from './pages/archive/StudentLessonsPage'
import StudentLexiconPage from './pages/archive/StudentLexiconPage'
import StudentProgressPage from './pages/archive/StudentProgressPage'
import StudentExamsPage from './pages/archive/StudentExamsPage'
import StudentAccompaniedDrivingPage from './pages/archive/StudentAccompaniedDrivingPage'
import StudentMessagesPage from './pages/archive/StudentMessagesPage'

import TeacherDashboardPage from './pages/archive/TeacherDashboardPage'
import TeacherPlanningPage from './pages/archive/TeacherPlanningPage'
import TeacherStudentsPage from './pages/archive/TeacherStudentsPage'
import TeacherLessonsPage from './pages/archive/TeacherLessonsPage'
import TeacherResourcesPage from './pages/archive/TeacherResourcesPage'
import TeacherVehiclesPage from './pages/archive/TeacherVehiclesPage'
import TeacherMessagesPage from './pages/archive/TeacherMessagesPage'
import TeacherProfilePage from './pages/archive/TeacherProfilePage'

import SecretaryDashboardPage from './pages/archive/SecretaryDashboardPage'
import SecretaryInscriptionsPage from './pages/archive/SecretaryInscriptionsPage'
import SecretaryPlanningPage from './pages/archive/SecretaryPlanningPage'
import SecretaryVehiclesPage from './pages/archive/SecretaryVehiclesPage'
import SecretaryPaiementsPage from './pages/archive/SecretaryPaiementsPage'
import SecretaryDocumentsPage from './pages/archive/SecretaryDocumentsPage'
import SecretaryExamsPage from './pages/archive/SecretaryExamsPage'
import SecretaryMessagesPage from './pages/archive/SecretaryMessagesPage'

function ProtectedRoute({ role, children }) {
  const currentRole = getStoredRole()
  if (currentRole !== role) {
    return <Navigate to="/login" replace />
  }
  return children
}

function withProtectedLayout(role, Page, fullWidth = false) {
  return (
    <ProtectedRoute role={role}>
      <DashboardLayout role={role} fullWidth={fullWidth}>
        <Page />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function App() {
  useEffect(() => {
    initDemoMode()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProfileSelection />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/manager/dashboard" element={withProtectedLayout('manager', ManagerDashboardPage)} />
        <Route path="/manager/students" element={withProtectedLayout('manager', ManagerStudentsPage)} />
        <Route path="/manager/teachers" element={withProtectedLayout('manager', ManagerTeachersPage)} />
        <Route path="/manager/users" element={withProtectedLayout('manager', ManagerUsersPage)} />
        <Route path="/manager/planning" element={withProtectedLayout('manager', ManagerPlanningPage)} />
        <Route path="/manager/vehicles" element={withProtectedLayout('manager', ManagerVehiclesPage)} />
        <Route path="/manager/contracts" element={withProtectedLayout('manager', ManagerContractsPage)} />
        <Route path="/manager/payments" element={withProtectedLayout('manager', ManagerPaymentsPage)} />
        <Route path="/manager/messages" element={withProtectedLayout('manager', ManagerMessagesPage)} />
        <Route path="/manager/statistics" element={withProtectedLayout('manager', ManagerStatisticsPage)} />
        <Route path="/manager/settings" element={withProtectedLayout('manager', ManagerSettingsPage)} />

        <Route path="/student/dashboard" element={withProtectedLayout('student', StudentDashboardPage)} />
        <Route path="/student/lessons" element={withProtectedLayout('student', StudentLessonsPage)} />
        <Route path="/student/lexicon" element={withProtectedLayout('student', StudentLexiconPage)} />
        <Route path="/student/progress" element={withProtectedLayout('student', StudentProgressPage)} />
        <Route path="/student/exams" element={withProtectedLayout('student', StudentExamsPage)} />
        <Route
          path="/student/accompanied-driving"
          element={withProtectedLayout('student', StudentAccompaniedDrivingPage)}
        />
        <Route
          path="/student/messages"
          element={withProtectedLayout('student', StudentMessagesPage)}
        />

        <Route path="/teacher/dashboard" element={withProtectedLayout('teacher', TeacherDashboardPage)} />
        <Route path="/teacher/planning" element={withProtectedLayout('teacher', TeacherPlanningPage)} />
        <Route path="/teacher/students" element={withProtectedLayout('teacher', TeacherStudentsPage)} />
        <Route path="/teacher/lessons" element={withProtectedLayout('teacher', TeacherLessonsPage)} />
        <Route path="/teacher/resources" element={withProtectedLayout('teacher', TeacherResourcesPage)} />
        <Route path="/teacher/vehicles" element={withProtectedLayout('teacher', TeacherVehiclesPage)} />
        <Route path="/teacher/messages" element={withProtectedLayout('teacher', TeacherMessagesPage)} />
        <Route path="/teacher/profile" element={withProtectedLayout('teacher', TeacherProfilePage)} />

        <Route
          path="/secretary/dashboard"
          element={withProtectedLayout('secretary', SecretaryDashboardPage)}
        />
        <Route
          path="/secretary/inscriptions"
          element={withProtectedLayout('secretary', SecretaryInscriptionsPage)}
        />
        <Route
          path="/secretary/planning"
          element={withProtectedLayout('secretary', SecretaryPlanningPage)}
        />
        <Route
          path="/secretary/vehicles"
          element={withProtectedLayout('secretary', SecretaryVehiclesPage)}
        />
        <Route
          path="/secretary/paiements"
          element={withProtectedLayout('secretary', SecretaryPaiementsPage)}
        />
        <Route
          path="/secretary/documents"
          element={withProtectedLayout('secretary', SecretaryDocumentsPage)}
        />
        <Route
          path="/secretary/exams"
          element={withProtectedLayout('secretary', SecretaryExamsPage)}
        />
        <Route
          path="/secretary/messages"
          element={withProtectedLayout('secretary', SecretaryMessagesPage)}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
