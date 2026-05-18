import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProfileSelection from './pages/ProfileSelection'
import DashboardLayout from './layouts/DashboardLayout'
import { initDemoMode } from './utils/demoMode'

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

function withLayout(role, Page, fullWidth = false) {
  return (
    <DashboardLayout role={role} fullWidth={fullWidth}>
      <Page />
    </DashboardLayout>
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

        <Route path="/manager/dashboard" element={withLayout('manager', ManagerDashboardPage)} />
        <Route path="/manager/students" element={withLayout('manager', ManagerStudentsPage)} />
        <Route path="/manager/teachers" element={withLayout('manager', ManagerTeachersPage)} />
        <Route path="/manager/users" element={withLayout('manager', ManagerUsersPage)} />
        <Route path="/manager/planning" element={withLayout('manager', ManagerPlanningPage)} />
        <Route path="/manager/vehicles" element={withLayout('manager', ManagerVehiclesPage)} />
        <Route path="/manager/contracts" element={withLayout('manager', ManagerContractsPage)} />
        <Route path="/manager/payments" element={withLayout('manager', ManagerPaymentsPage)} />
        <Route path="/manager/statistics" element={withLayout('manager', ManagerStatisticsPage)} />
        <Route path="/manager/settings" element={withLayout('manager', ManagerSettingsPage)} />

        <Route path="/student/dashboard" element={withLayout('student', StudentDashboardPage)} />
        <Route path="/student/lessons" element={withLayout('student', StudentLessonsPage)} />
        <Route path="/student/lexicon" element={withLayout('student', StudentLexiconPage)} />
        <Route path="/student/progress" element={withLayout('student', StudentProgressPage)} />
        <Route path="/student/exams" element={withLayout('student', StudentExamsPage)} />
        <Route
          path="/student/accompanied-driving"
          element={withLayout('student', StudentAccompaniedDrivingPage)}
        />
        <Route
          path="/student/messages"
          element={withLayout('student', StudentMessagesPage)}
        />

        <Route path="/teacher/dashboard" element={withLayout('teacher', TeacherDashboardPage)} />
        <Route path="/teacher/planning" element={withLayout('teacher', TeacherPlanningPage)} />
        <Route path="/teacher/students" element={withLayout('teacher', TeacherStudentsPage)} />
        <Route path="/teacher/lessons" element={withLayout('teacher', TeacherLessonsPage)} />
        <Route path="/teacher/resources" element={withLayout('teacher', TeacherResourcesPage)} />
        <Route path="/teacher/vehicles" element={withLayout('teacher', TeacherVehiclesPage)} />
        <Route path="/teacher/messages" element={withLayout('teacher', TeacherMessagesPage)} />
        <Route path="/teacher/profile" element={withLayout('teacher', TeacherProfilePage)} />

        <Route
          path="/secretary/dashboard"
          element={withLayout('secretary', SecretaryDashboardPage)}
        />
        <Route
          path="/secretary/inscriptions"
          element={withLayout('secretary', SecretaryInscriptionsPage)}
        />
        <Route
          path="/secretary/planning"
          element={withLayout('secretary', SecretaryPlanningPage)}
        />
        <Route
          path="/secretary/vehicles"
          element={withLayout('secretary', SecretaryVehiclesPage)}
        />
        <Route
          path="/secretary/paiements"
          element={withLayout('secretary', SecretaryPaiementsPage)}
        />
        <Route
          path="/secretary/documents"
          element={withLayout('secretary', SecretaryDocumentsPage)}
        />
        <Route
          path="/secretary/exams"
          element={withLayout('secretary', SecretaryExamsPage)}
        />
        <Route
          path="/secretary/messages"
          element={withLayout('secretary', SecretaryMessagesPage)}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
