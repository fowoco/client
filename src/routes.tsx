import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { AppLayout } from './components/layout/AppLayout'
import { EmailSentPage } from './pages/EmailSentPage/EmailSentPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage'
import { IntroPage } from './pages/IntroPage/IntroPage'
import { LinkExpiredPage } from './pages/LinkExpiredPage/LinkExpiredPage'
import { LinkRequestPage } from './pages/LinkRequestPage/LinkRequestPage'
import { LinkUploadPage } from './pages/LinkUploadPage/LinkUploadPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage'
import { OnboardingImportPage } from './pages/OnboardingImportPage/OnboardingImportPage'
import { ResetCompletePage } from './pages/ResetCompletePage/ResetCompletePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage/ResetPasswordPage'
import { SignupPage } from './pages/SignupPage/SignupPage'

const AgentLogPage = lazy(() =>
  import('./pages/AgentLogPage/AgentLogPage').then((module) => ({ default: module.AgentLogPage })),
)
const CaseDetailPage = lazy(() =>
  import('./pages/CaseDetailPage/CaseDetailPage').then((module) => ({
    default: module.CaseDetailPage,
  })),
)
const CreateWorkPage = lazy(() =>
  import('./pages/CreateWorkPage/CreateWorkPage').then((module) => ({
    default: module.CreateWorkPage,
  })),
)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const DocumentDetailPage = lazy(() =>
  import('./pages/DocumentDetailPage/DocumentDetailPage').then((module) => ({
    default: module.DocumentDetailPage,
  })),
)
const DocumentListPage = lazy(() =>
  import('./pages/DocumentListPage/DocumentListPage').then((module) => ({
    default: module.DocumentListPage,
  })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)
const ReviewWorkPage = lazy(() =>
  import('./pages/ReviewWorkPage/ReviewWorkPage').then((module) => ({
    default: module.ReviewWorkPage,
  })),
)
const WorkerDetailPage = lazy(() =>
  import('./pages/WorkerDetailPage/WorkerDetailPage').then((module) => ({
    default: module.WorkerDetailPage,
  })),
)
const WorkerListPage = lazy(() =>
  import('./pages/WorkerListPage/WorkerListPage').then((module) => ({
    default: module.WorkerListPage,
  })),
)
const WorkListPage = lazy(() =>
  import('./pages/WorkListPage/WorkListPage').then((module) => ({
    default: module.WorkListPage,
  })),
)

export const router = createBrowserRouter([
  { path: '/', element: <IntroPage />, errorElement: <NotFoundPage /> },
  { path: '/login', element: <LoginPage />, errorElement: <NotFoundPage /> },
  { path: '/signup', element: <SignupPage />, errorElement: <NotFoundPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage />, errorElement: <NotFoundPage /> },
  { path: '/email-sent', element: <EmailSentPage />, errorElement: <NotFoundPage /> },
  { path: '/reset-password', element: <ResetPasswordPage />, errorElement: <NotFoundPage /> },
  { path: '/reset-complete', element: <ResetCompletePage />, errorElement: <NotFoundPage /> },
  {
    element: <RequireAuth />,
    errorElement: <NotFoundPage />,
    children: [
      { path: '/onboarding/import', element: <OnboardingImportPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/workers', element: <WorkerListPage /> },
          { path: '/workers/:workerId', element: <WorkerListPage /> },
          { path: '/workers/:workerId/detail', element: <WorkerDetailPage /> },
          { path: '/documents', element: <DocumentListPage /> },
          { path: '/documents/:documentId', element: <DocumentDetailPage /> },
          { path: '/tasks', element: <WorkListPage /> },
          { path: '/tasks/new', element: <CreateWorkPage /> },
          { path: '/tasks/new/review', element: <ReviewWorkPage /> },
          { path: '/tasks/:taskId', element: <CaseDetailPage /> },
          { path: '/agent', element: <AgentLogPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '/worker-portal', element: <LinkRequestPage /> },
  { path: '/worker-portal/expired', element: <LinkExpiredPage /> },
  { path: '/worker-portal/:token/upload', element: <LinkUploadPage /> },
  { path: '/worker-portal/:token/expired', element: <LinkExpiredPage /> },
  { path: '/worker-portal/:token', element: <LinkRequestPage /> },
  { path: '*', element: <NotFoundPage /> },
])
