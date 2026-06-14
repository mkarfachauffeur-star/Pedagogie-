import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProfileSelection from './pages/ProfileSelection'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import DashboardLayout from './layouts/DashboardLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'
import AuthHashRedirect from './components/AuthHashRedirect'

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
import ManagerExportsPage from './pages/app-pages/ManagerExportsPage'
import ManagerPackagesPage from './pages/app-pages/ManagerPackagesPage'

import PlatformLayout from './layouts/PlatformLayout'
import PlatformProtectedRoute from './components/PlatformProtectedRoute'
import PlatformDashboardPage from './pages/platform/PlatformDashboardPage'
import PlatformOrganizationsPage from './pages/platform/PlatformOrganizationsPage'
import PlatformSubscriptionsPage from './pages/platform/PlatformSubscriptionsPage'
import PlatformAuditPage from './pages/platform/PlatformAuditPage'

import StudentDashboardPage from './pages/app-pages/StudentDashboardPage'
const StudentLessonsPage = lazy(() => import('./pages/app-pages/StudentLessonsPage'))
import StudentLexiconPage from './pages/app-pages/StudentLexiconPage'
import StudentProgressPage from './pages/app-pages/StudentProgressPage'
import StudentExamsPage from './pages/app-pages/StudentExamsPage'
import StudentPracticeExamsPage from './pages/app-pages/StudentPracticeExamsPage'
import StudentAccompaniedDrivingPage from './pages/app-pages/StudentAccompaniedDrivingPage'
import StudentMessagesPage from './pages/app-pages/StudentMessagesPage'
import StudentInitialAssessmentPage from './pages/app-pages/StudentInitialAssessmentPage'
import StudentPlanningPage from './pages/app-pages/StudentPlanningPage'
import StudentDocumentsPage from './pages/app-pages/StudentDocumentsPage'
import StudentContractPage from './pages/app-pages/StudentContractPage'
import StudentNextLessonPage from './pages/app-pages/StudentNextLessonPage'
import StudentCompetencyReportsPage from './pages/app-pages/StudentCompetencyReportsPage'
import StudentPedagogicalAppointmentsPage from './pages/app-pages/StudentPedagogicalAppointmentsPage'
import StudentTrackRoute from './components/StudentTrackRoute'
import StudentAccountGate from './components/StudentAccountGate'
import RouteErrorBoundary from './components/RouteErrorBoundary'

import TeacherDashboardPage from './pages/app-pages/TeacherDashboardPage'
import TeacherPlanningPage from './pages/app-pages/TeacherPlanningPage'
import TeacherStudentsPage from './pages/app-pages/TeacherStudentsPage'
import TeacherLessonsPage from './pages/app-pages/TeacherLessonsPage'
import TeacherVehiclesPage from './pages/app-pages/TeacherVehiclesPage'
import TeacherMessagesPage from './pages/app-pages/TeacherMessagesPage'
import TeacherFinancePage from './pages/app-pages/TeacherFinancePage'
import TeacherProfilePage from './pages/app-pages/TeacherProfilePage'

import SecretaryDashboardPage from './pages/app-pages/SecretaryDashboardPage'
import SecretaryInscriptionsPage from './pages/app-pages/SecretaryInscriptionsPage'
import SecretaryPlanningPage from './pages/app-pages/SecretaryPlanningPage'
import SecretaryVehiclesPage from './pages/app-pages/SecretaryVehiclesPage'
import SecretaryPaiementsPage from './pages/app-pages/SecretaryPaiementsPage'
import SecretaryDocumentsPage from './pages/app-pages/SecretaryDocumentsPage'
import SecretaryExamsPage from './pages/app-pages/SecretaryExamsPage'
import SecretaryMessagesPage from './pages/app-pages/SecretaryMessagesPage'
import PreRegistrationsPage from './pages/app-pages/PreRegistrationsPage'

function withProtectedLayout(role, Page, fullWidth = false) {
  return (
    <ProtectedRoute role={role}>
      <DashboardLayout role={role} fullWidth={fullWidth}>
        <Page />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function withStudentLayout(Page, fullWidth = false) {
  return (
    <ProtectedRoute role="student">
      <DashboardLayout role="student" fullWidth={fullWidth}>
        <RouteErrorBoundary>
          <StudentAccountGate>
            <StudentTrackRoute>
              <Page />
            </StudentTrackRoute>
          </StudentAccountGate>
        </RouteErrorBoundary>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthHashRedirect />
      <Routes>
        <Route path="/" element={<ProfileSelection />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/manager/dashboard" element={withProtectedLayout('manager', ManagerDashboardPage)} />
        <Route path="/manager/students" element={withProtectedLayout('manager', ManagerStudentsPage)} />
        <Route path="/manager/pre-registrations" element={withProtectedLayout('manager', () => <PreRegistrationsPage roleLabel="Gérant" />)} />
        <Route path="/manager/teachers" element={withProtectedLayout('manager', ManagerTeachersPage)} />
        <Route path="/manager/users" element={withProtectedLayout('manager', ManagerUsersPage)} />
        <Route path="/manager/planning" element={withProtectedLayout('manager', ManagerPlanningPage)} />
        <Route path="/manager/vehicles" element={withProtectedLayout('manager', ManagerVehiclesPage)} />
        <Route path="/manager/contracts" element={withProtectedLayout('manager', ManagerContractsPage)} />
        <Route path="/manager/payments" element={withProtectedLayout('manager', ManagerPaymentsPage)} />
        <Route path="/manager/exports" element={withProtectedLayout('manager', ManagerExportsPage)} />
        <Route path="/manager/packages" element={withProtectedLayout('manager', ManagerPackagesPage)} />
        <Route path="/manager/regulatory-export" element={<Navigate replace to="/manager/exports" />} />
        <Route path="/manager/messages" element={withProtectedLayout('manager', ManagerMessagesPage)} />
        <Route path="/manager/statistics" element={withProtectedLayout('manager', ManagerStatisticsPage)} />
        <Route path="/manager/settings" element={withProtectedLayout('manager', ManagerSettingsPage)} />
        <Route path="/manager/settings/pricing" element={<Navigate replace to="/manager/packages" />} />

        <Route path="/student/dashboard" element={withStudentLayout(StudentDashboardPage)} />
        <Route
          path="/student/lessons"
          element={
            <ProtectedRoute role="student">
              <DashboardLayout role="student">
                <StudentTrackRoute>
                  <Suspense fallback={<LoadingSpinner label="Chargement des leçons…" />}>
                    <StudentLessonsPage />
                  </Suspense>
                </StudentTrackRoute>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/student/planning" element={withStudentLayout(StudentPlanningPage)} />
        <Route path="/student/initial-assessment" element={withStudentLayout(StudentInitialAssessmentPage)} />
        <Route path="/student/competency-reports" element={withStudentLayout(StudentCompetencyReportsPage)} />
        <Route path="/student/pedagogical-appointments" element={withStudentLayout(StudentPedagogicalAppointmentsPage)} />
        <Route path="/student/observations" element={<Navigate replace to="/student/competency-reports" />} />
        <Route path="/student/documents" element={withStudentLayout(StudentDocumentsPage)} />
        <Route path="/student/contract" element={withStudentLayout(StudentContractPage)} />
        <Route path="/student/payments" element={<Navigate replace to="/student/contract" />} />
        <Route path="/student/next-lesson" element={withStudentLayout(StudentNextLessonPage)} />
        <Route path="/student/lexicon" element={withStudentLayout(StudentLexiconPage)} />
        <Route path="/student/progress" element={withStudentLayout(StudentProgressPage)} />
        <Route path="/student/exams" element={withStudentLayout(StudentExamsPage)} />
        <Route path="/student/practice-exams" element={withStudentLayout(StudentPracticeExamsPage)} />
        <Route
          path="/student/accompanied-driving"
          element={withStudentLayout(StudentAccompaniedDrivingPage)}
        />
        <Route
          path="/student/messages"
          element={withStudentLayout(StudentMessagesPage)}
        />

        <Route path="/teacher/dashboard" element={withProtectedLayout('teacher', TeacherDashboardPage)} />
        <Route path="/teacher/planning" element={withProtectedLayout('teacher', TeacherPlanningPage)} />
        <Route path="/teacher/students" element={withProtectedLayout('teacher', TeacherStudentsPage)} />
        <Route path="/teacher/lessons" element={withProtectedLayout('teacher', TeacherLessonsPage)} />
        <Route path="/teacher/vehicles" element={withProtectedLayout('teacher', TeacherVehiclesPage)} />
        <Route path="/teacher/messages" element={withProtectedLayout('teacher', TeacherMessagesPage)} />
        <Route path="/teacher/finance" element={withProtectedLayout('teacher', TeacherFinancePage)} />
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
          path="/secretary/pre-registrations"
          element={withProtectedLayout('secretary', () => <PreRegistrationsPage roleLabel="Secrétariat" />)}
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

        <Route
          path="/platform"
          element={
            <PlatformProtectedRoute>
              <PlatformLayout />
            </PlatformProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PlatformDashboardPage />} />
          <Route path="organizations" element={<PlatformOrganizationsPage />} />
          <Route path="subscriptions" element={<PlatformSubscriptionsPage />} />
          <Route path="audit" element={<PlatformAuditPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
