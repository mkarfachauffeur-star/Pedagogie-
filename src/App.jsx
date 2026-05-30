import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProfileSelection from './pages/ProfileSelection'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'

import ManagerDashboardPage from './pages/app-pages/AdminDashboardPage'
import ManagerStudentsPage from './pages/app-pages/AdminStudentsPage'
import ManagerTeachersPage from './pages/app-pages/AdminTeachersPage'
import ManagerUsersPage from './pages/app-pages/AdminUsersPage'
import ManagerPlanningPage from './pages/app-pages/AdminPlanningPage'
import ManagerVehiclesPage from './pages/app-pages/AdminVehiclesPage'
import ManagerContractsPage from './pages/app-pages/AdminContractsPage'
import ManagerPaymentsPage from './pages/app-pages/AdminPaymentsPage'
import ManagerStatisticsPage from './pages/app-pages/AdminStatisticsPage'
import ManagerSettingsPage from './pages/app-pages/AdminSettingsPage'
import ManagerMessagesPage from './pages/app-pages/ManagerMessagesPage'

import StudentDashboardPage from './pages/app-pages/StudentDashboardPage'
const StudentLessonsPage = lazy(() => import('./pages/app-pages/StudentLessonsPage'))
import StudentLexiconPage from './pages/app-pages/StudentLexiconPage'
import StudentProgressPage from './pages/app-pages/StudentProgressPage'
import StudentExamsPage from './pages/app-pages/StudentExamsPage'
import StudentAccompaniedDrivingPage from './pages/app-pages/StudentAccompaniedDrivingPage'
import StudentMessagesPage from './pages/app-pages/StudentMessagesPage'

import TeacherDashboardPage from './pages/app-pages/TeacherDashboardPage'
import TeacherPlanningPage from './pages/app-pages/TeacherPlanningPage'
import TeacherStudentsPage from './pages/app-pages/TeacherStudentsPage'
import TeacherLessonsPage from './pages/app-pages/TeacherLessonsPage'
import TeacherVehiclesPage from './pages/app-pages/TeacherVehiclesPage'
import TeacherMessagesPage from './pages/app-pages/TeacherMessagesPage'
import TeacherProfilePage from './pages/app-pages/TeacherProfilePage'

import SecretaryDashboardPage from './pages/app-pages/SecretaryDashboardPage'
import SecretaryInscriptionsPage from './pages/app-pages/SecretaryInscriptionsPage'
import SecretaryPlanningPage from './pages/app-pages/SecretaryPlanningPage'
import SecretaryVehiclesPage from './pages/app-pages/SecretaryVehiclesPage'
import SecretaryPaiementsPage from './pages/app-pages/SecretaryPaiementsPage'
import SecretaryDocumentsPage from './pages/app-pages/SecretaryDocumentsPage'
import SecretaryExamsPage from './pages/app-pages/SecretaryExamsPage'
import SecretaryMessagesPage from './pages/app-pages/SecretaryMessagesPage'

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
        <Route
          path="/student/lessons"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout role="student">
                <Suspense fallback={<LoadingSpinner label="Chargement des leçons…" />}>
                  <StudentLessonsPage />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
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
